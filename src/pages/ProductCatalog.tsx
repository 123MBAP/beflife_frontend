import React, { useMemo, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { FiFilter, FiX } from 'react-icons/fi';
import ProductCard from '../components/ProductCard';
import type { ProductCardData } from '../components/ProductCard';
import HorizontalScrollRow from '../components/HorizontalScrollRow';
import MobileBottomNav from '../components/MobileBottomNav';

/* ─── fuzzy search helpers ─── */
type ApiCategory = { id: string; name: string };
type ApiAdvert = {
    id: string;
    title: string;
    productLink: string;
    mediaType: 'IMAGE' | 'VIDEO';
    imageUrl?: string | null;
    videoUrl?: string | null;
    isActive?: boolean;
};
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const normalizeTight = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

const levenshtein = (a: string, b: string) => {
    const alen = a.length, blen = b.length;
    if (alen === 0) return blen;
    if (blen === 0) return alen;
    const dp = new Array(blen + 1).fill(0).map((_, i) => i);
    for (let i = 1; i <= alen; i++) {
        let prev = dp[0]; dp[0] = i;
        for (let j = 1; j <= blen; j++) {
            const tmp = dp[j];
            dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
            prev = tmp;
        }
    }
    return dp[blen];
};

const scoreMatch = (query: string, candidate: string) => {
    const q = normalize(query), c = normalize(candidate);
    const qt = normalizeTight(query), ct = normalizeTight(candidate);
    if (!q || !c) return 0;
    if (ct === qt) return 1;
    if (ct.startsWith(qt)) return 0.95;
    if (ct.includes(qt)) return 0.9;
    if (c.startsWith(q)) return 0.85;
    if (c.includes(q)) return 0.8;
    if (qt.length >= 4 && ct.length >= 4) {
        let best = 1 - levenshtein(qt, ct) / Math.max(qt.length, ct.length);
        if (best < 0.72) {
            const tokens = c.split(' ').filter(Boolean).map(normalizeTight).filter(Boolean);
            for (let i = 0; i < tokens.length; i++) {
                best = Math.max(best, 1 - levenshtein(qt, tokens[i]) / Math.max(qt.length, tokens[i].length));
            }
        }
        return best >= 0.72 ? best : 0;
    }
    return 0;
};

/* ─── filter tag pill ─── */
const FilterPill: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
    <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full">
        {label}
        <button onClick={onRemove} className="cursor-pointer border-none bg-transparent p-0 text-blue-400 hover:text-blue-700 transition">
            <FiX size={12} />
        </button>
    </span>
);

/* ═══════════════════════════════════════════
   PRODUCT CATALOG
═══════════════════════════════════════════ */
const ProductCatalog: React.FC = () => {
    const apiBaseUrl = (process.env.REACT_APP_API_URL ?? '').replace(/\/$/, '');
    const location = useLocation();

    /* State */
    const [uploadedProducts, setUploadedProducts] = useState<any[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [adverts, setAdverts] = useState<ApiAdvert[]>([]);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const initialSearch = useMemo(() => new URLSearchParams(location.search).get('q')?.trim() ?? '', [location.search]);
    const initialCategory = useMemo(() => new URLSearchParams(location.search).get('category')?.trim() ?? 'all', [location.search]);

    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [sortBy, setSortBy] = useState('name');

    useEffect(() => { setSelectedCategory(initialCategory); }, [initialCategory]);
    useEffect(() => { setSearchTerm(initialSearch); }, [initialSearch]);

    /* Fetch categories */
    useEffect(() => {
        if (!apiBaseUrl) return;
        fetch(`${apiBaseUrl}/api/categories`)
            .then((r) => r.json())
            .then((d) => { if (d?.ok) setCategories(Array.isArray(d?.categories) ? d.categories : []); })
            .catch(() => { });
    }, [apiBaseUrl]);

    /* Fetch products */
    useEffect(() => {
        if (!apiBaseUrl) return;
        setProductsLoading(true);
        fetch(`${apiBaseUrl}/api/products`)
            .then((r) => r.json())
            .then((d) => { if (d?.ok || d?.products) setUploadedProducts(d?.products ?? []); })
            .catch(() => { })
            .finally(() => setProductsLoading(false));
    }, [apiBaseUrl]);

    /* Fetch adverts/banners (Homepage-style) */
    useEffect(() => {
        if (!apiBaseUrl) return;
        fetch(`${apiBaseUrl}/api/adverts`)
            .then((r) => r.json())
            .then((d) => {
                if (d?.ok) setAdverts(Array.isArray(d?.adverts) ? d.adverts : []);
            })
            .catch(() => { });
    }, [apiBaseUrl]);

    /* Normalise products into ProductCardData */
    const products = useMemo<ProductCardData[]>(() =>
        uploadedProducts.map((p) => {
            const discount = p.discount || null;
            const price = p.price ?? 0;
            const oldPrice = discount ? Number((price / (1 - discount / 100)).toFixed(2)) : null;
            return {
                id: p.id,
                name: p.name,
                category: p.category || 'General',
                price,
                oldPrice,
                currency: 'RWF',
                image: (Array.isArray(p.imageUrls) && p.imageUrls.length > 0) ? p.imageUrls[0] : (p.imageUrl || p.image_url || '/ring.png'),
                discount,
                isNew: Boolean(p.isNew),
                inStock: Boolean(p.inStock),
            };
        }),
        [uploadedProducts]);

    const imageAdverts = useMemo(() => {
        return adverts
            .filter((a) => a && a.mediaType === 'IMAGE')
            .filter((a) => a.isActive !== false)
            .filter((a) => typeof a.id === 'string' && a.id.trim().length > 0);
    }, [adverts]);

    /* Filter & sort */
    const filteredProducts = useMemo(() => {
        let result = [...products];
        if (searchTerm) {
            const q = searchTerm.trim();
            result = result.filter((p) => {
                const original = uploadedProducts.find((u) => u.id === p.id);
                const nameScore = scoreMatch(q, String(p.name ?? ''));
                const descScore = scoreMatch(q, String(original?.description ?? '')) * 0.65;
                const catScore = scoreMatch(q, String(p.category ?? '')) * 0.75;
                return Math.max(nameScore, descScore, catScore) > 0;
            });
        }
        if (selectedCategory !== 'all') {
            result = result.filter((p) => p.category.toLowerCase().includes(selectedCategory.toLowerCase()));
        }
        result.sort((a, b) => {
            if (sortBy === 'price-low') return a.price - b.price;
            if (sortBy === 'price-high') return b.price - a.price;
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            return 0;
        });
        return result;
    }, [products, searchTerm, selectedCategory, sortBy, uploadedProducts]);

    const categoryOptions = useMemo(() => {
        const base = [{ value: 'all', label: 'All' }];
        const seen = new Set(['all']);
        categories.filter((c) => c?.name).forEach((c) => {
            if (!seen.has(c.name.toLowerCase())) { seen.add(c.name.toLowerCase()); base.push({ value: c.name, label: c.name }); }
        });
        return base;
    }, [categories]);

    const activeFilters: { label: string; clear: () => void }[] = [];
    if (searchTerm) activeFilters.push({ label: `"${searchTerm}"`, clear: () => setSearchTerm('') });
    if (selectedCategory !== 'all') activeFilters.push({ label: selectedCategory, clear: () => setSelectedCategory('all') });

    return (
        <div className="bg-slate-50 min-h-screen py-4 pb-24 md:py-6 md:pb-28 font-outfit selection:bg-blue-600 selection:text-white">
            <div className="max-w-[1400px] mx-auto px-3 md:px-8">

                {/* Top horizontal scroller (banners) */}
                {imageAdverts.length > 0 && (
                    <div className="mb-4 md:mb-6">
                        <HorizontalScrollRow gap={1} showArrows>
                            {imageAdverts.map((a) => {
                                const src = apiBaseUrl
                                    ? `${apiBaseUrl}/api/banners/${a.id}/media`
                                    : (a.imageUrl ?? '');
                                const to = a.productLink || '/products';
                                const isExternal = /^https?:\/\//i.test(to);

                                const content = (
                                    <div className="relative w-[180px] sm:w-[210px] md:w-[240px] h-[110px] md:h-[120px] rounded-2xl overflow-hidden bg-slate-50 border border-gray-100 shadow-sm">
                                        <img
                                            src={src}
                                            alt={a.title || 'Banner'}
                                            className="w-full h-full object-contain"
                                            loading="lazy"
                                            decoding="async"
                                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/ring.png'; }}
                                        />
                                        {(a.title || '').trim().length > 0 && (
                                            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/55 via-black/20 to-transparent">
                                                <p className="m-0 text-white text-xs font-extrabold leading-tight">
                                                    {a.title}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );

                                return isExternal ? (
                                    <a
                                        key={a.id}
                                        href={to}
                                        className="block flex-shrink-0 no-underline"
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        {content}
                                    </a>
                                ) : (
                                    <Link key={a.id} to={to} className="block flex-shrink-0 no-underline">
                                        {content}
                                    </Link>
                                );
                            })}
                        </HorizontalScrollRow>
                    </div>
                )}


                {/* Page header + filters (compact) */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 md:gap-4 mb-4 md:mb-6">
                    <div className="text-left md:text-left">
                        <span className="inline-block bg-blue-50 text-blue-600 text-[0.65rem] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest mb-2">
                            Shop Collection
                        </span>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 m-0 tracking-tight">Our Products</h1>
                        <p className="text-slate-500 text-sm mt-1 font-medium">
                            {productsLoading ? 'Loading…' : `${filteredProducts.length} item${filteredProducts.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>

                    {/* ── Filter bar ── */}
                    <div className="bg-white rounded-2xl p-2.5 md:p-3 shadow-sm border border-gray-50 flex flex-col gap-2 w-full md:w-[680px]">
                        {/* Top row: search + mobile filter toggle */}
                        <div className="flex gap-2 items-center">
                            <div className="relative flex-1">
                                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                                <input
                                    type="text"
                                    placeholder="Search products…"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-9 py-2 bg-slate-50 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300 border-none transition"
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer border-none bg-transparent transition">
                                        <FiX size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Mobile: toggle filter panel */}
                            <button
                                onClick={() => setShowMobileFilters((v) => !v)}
                                className="md:hidden w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 border-none cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition flex-shrink-0"
                            >
                                <FiFilter size={15} />
                            </button>

                            {/* Desktop: category & sort inline */}
                            <div className="hidden md:flex items-center gap-2">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="px-3.5 py-2 bg-slate-50 rounded-full text-sm font-semibold text-slate-700 border-none focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
                                >
                                    {categoryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-3.5 py-2 bg-slate-50 rounded-full text-sm font-semibold text-slate-700 border-none focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
                                >
                                    <option value="name">A–Z</option>
                                    <option value="price-low">Price ↑</option>
                                    <option value="price-high">Price ↓</option>
                                </select>
                            </div>
                        </div>

                        {/* Mobile filter panel */}
                        {showMobileFilters && (
                            <div className="md:hidden flex items-center gap-2 flex-wrap">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="flex-1 px-3.5 py-2 bg-slate-50 rounded-full text-sm font-semibold text-slate-700 border-none focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
                                >
                                    {categoryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="flex-1 px-3.5 py-2 bg-slate-50 rounded-full text-sm font-semibold text-slate-700 border-none focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
                                >
                                    <option value="name">A–Z</option>
                                    <option value="price-low">Price ↑</option>
                                    <option value="price-high">Price ↓</option>
                                </select>
                            </div>
                        )}

                        {/* Active filter pills */}
                        {activeFilters.length > 0 && (
                            <div className="flex gap-2 flex-wrap items-center">
                                {activeFilters.map((f) => <FilterPill key={f.label} label={f.label} onRemove={f.clear} />)}
                                <button
                                    onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                                    className="text-xs font-bold text-gray-400 hover:text-red-500 transition cursor-pointer border-none bg-transparent"
                                >
                                    Clear all
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Loading skeleton */}
                {productsLoading && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 bg-gray-200 gap-px border border-gray-200 overflow-hidden shadow-sm">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="bg-white animate-pulse">
                                <div className="p-3 space-y-2">
                                    <div className="h-2 bg-gray-100 rounded w-1/4" />
                                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                                </div>
                                <div className="bg-gray-100" style={{ height: '160px' }} />
                                <div className="p-3 flex justify-between items-center">
                                    <div className="h-4 bg-gray-100 rounded w-1/3" />
                                    <div className="w-8 h-8 bg-gray-100 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Product grid ── */}
                {!productsLoading && filteredProducts.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-px border border-gray-200 overflow-hidden shadow-sm">
                        {filteredProducts.map((product, index) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                variant="default"
                                featured={index % 7 === 0 && index !== 0}
                            />
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!productsLoading && filteredProducts.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm mt-4 border border-gray-50 flex flex-col items-center">
                        <FaSearch size={48} className="text-gray-200 mb-6" />
                        <h3 className="text-xl font-extrabold text-slate-800 mb-2">No products found</h3>
                        <p className="text-gray-500 mb-6 font-medium text-sm max-w-xs">
                            Try adjusting your search criteria or browse all products
                        </p>
                        <button
                            onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                            className="bg-blue-600 text-white font-bold text-sm px-6 py-3 rounded-full hover:bg-blue-700 transition cursor-pointer border-none shadow"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>

            <MobileBottomNav />
        </div>
    );
};

export default ProductCatalog;