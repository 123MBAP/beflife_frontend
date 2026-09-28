import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCpu, FiMonitor, FiSmartphone, FiHeadphones, FiWatch } from 'react-icons/fi';
import { FaRegLightbulb, FaFire, FaStar } from 'react-icons/fa';
import ProductCard, { ProductCardData } from '../components/ProductCard';
import HorizontalScrollRow from '../components/HorizontalScrollRow';
import SectionHeader from '../components/SectionHeader';
import MobileBottomNav from '../components/MobileBottomNav';
import ringsImage from '../images/rings.png';

/* ─────────────────────── types ─────────────────────── */
type ApiCategory = { id: string; name: string };
type ApiProduct = {
    id: string;
    name: string;
    category: string;
    price: number;
    currency: string;
    imageUrls?: string[];
    imageUrl?: string;
    image_url?: string;
    inStock: boolean;
    isNew?: boolean;
    discount?: number | null;
};

type ApiAdvert = {
    id: string;
    title: string;
    productLink: string;
    mediaType: 'IMAGE' | 'VIDEO';
    imageUrl?: string | null;
    videoUrl?: string | null;
    isActive?: boolean;
};

const getPrimaryImage = (p: ApiProduct) => {
    if (Array.isArray(p.imageUrls) && p.imageUrls.length > 0 && p.imageUrls[0]) return p.imageUrls[0];
    return p.imageUrl || p.image_url || ringsImage;
};

const toCardData = (p: ApiProduct): ProductCardData => {
    const discount = typeof p.discount === 'number' ? p.discount : null;
    const oldPrice = discount ? Number((p.price / (1 - discount / 100)).toFixed(2)) : null;
    return {
        id: p.id,
        name: p.name,
        category: p.category || 'General',
        price: p.price,
        oldPrice,
        currency: p.currency || '$',
        image: getPrimaryImage(p),
        discount,
        isNew: Boolean(p.isNew),
        inStock: p.inStock,
    };
};

const withCloudinaryTransform = (url: string, transform: string) => {
    if (!url) return url;
    const marker = '/image/upload/';
    const idx = url.indexOf(marker);
    if (idx === -1) return url;
    const prefix = url.slice(0, idx + marker.length);
    const rest = url.slice(idx + marker.length);
    if (rest.startsWith(transform + '/')) return url;
    return `${prefix}${transform}/${rest}`;
};

/* ─────────────────────── skeleton ─────────────────────── */
const CardSkeleton: React.FC<{ height?: number }> = ({ height = 130 }) => (
    <div className="bg-white overflow-hidden shadow-sm animate-pulse flex-shrink-0" style={{ width: '170px', border: '1px solid #f3f4f6' }}>
        <div className="p-3 space-y-1.5">
            <div className="h-2 bg-gray-100 rounded w-1/4" />
            <div className="h-3 bg-gray-100 rounded w-3/4" />
        </div>
        <div className="bg-gray-100" style={{ height }} />
        <div className="p-3 flex justify-between items-center">
            <div className="h-4 bg-gray-100 rounded w-1/3" />
            <div className="w-8 h-8 bg-gray-100 rounded-full" />
        </div>
    </div>
);

const GridSkeleton: React.FC = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px border border-gray-200 overflow-hidden shadow-sm">
        {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white animate-pulse">
                <div className="p-3 space-y-1.5">
                    <div className="h-2 bg-gray-100 rounded w-1/4" />
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
                <div className="bg-gray-100" style={{ height: '180px' }} />
                <div className="p-3 flex justify-between items-center">
                    <div className="h-4 bg-gray-100 rounded w-1/3" />
                    <div className="w-8 h-8 bg-gray-100 rounded-full" />
                </div>
            </div>
        ))}
    </div>
);

/* ─────────────────────── category icons ─────────────────────── */
const CATEGORY_ICONS = [
    <FiCpu size={18} />, <FiMonitor size={18} />, <FiSmartphone size={18} />,
    <FiHeadphones size={18} />, <FiWatch size={18} />, <FaRegLightbulb size={18} />,
];

/* ═══════════════════════════════════════════════════════════════
   HOMEPAGE COMPONENT
═══════════════════════════════════════════════════════════════ */
const Homepage: React.FC = () => {
    const apiBaseUrl = useMemo(() => (process.env.REACT_APP_API_URL ?? '').replace(/\/$/, ''), []);

    const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
    const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
    const [apiAdverts, setApiAdverts] = useState<ApiAdvert[]>([]);
    const [activeAdvertIndex, setActiveAdvertIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');

    useEffect(() => {
        const load = async () => {
            if (!apiBaseUrl) return;
            setIsLoading(true);
            try {
                const [catRes, prodRes, advRes] = await Promise.all([
                    fetch(`${apiBaseUrl}/api/categories`),
                    fetch(`${apiBaseUrl}/api/products`),
                    fetch(`${apiBaseUrl}/api/adverts`),
                ]);
                const catData = await catRes.json().catch(() => ({}));
                if (catRes.ok && catData?.ok) setApiCategories(Array.isArray(catData?.categories) ? catData.categories : []);
                const prodData = await prodRes.json().catch(() => ({}));
                if (prodRes.ok && prodData?.ok) setApiProducts(Array.isArray(prodData?.products) ? prodData.products : []);
                const advData = await advRes.json().catch(() => ({}));
                if (advRes.ok && advData?.ok) setApiAdverts(Array.isArray(advData?.adverts) ? advData.adverts : []);
            } catch (err) {
                console.error('Homepage load failed:', err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [apiBaseUrl]);

    /* Derived data */
    const allCards = useMemo(() => apiProducts.map(toCardData), [apiProducts]);
    const trendingCards = useMemo(() => allCards.slice(0, 12), [allCards]);
    const newArrivalsCards = useMemo(() => allCards.filter((p) => p.isNew).slice(0, 8), [allCards]);
    const newArrivalsDisplay = newArrivalsCards.length > 0 ? newArrivalsCards : allCards.slice(0, 8);
    const recommendedCards = useMemo(() => [...allCards].sort(() => Math.random() - 0.5).slice(0, 10), [allCards]);

    const heroProduct = allCards[0] ?? { id: '', name: 'Loading…', category: '', price: 0, currency: '$', image: ringsImage, inStock: true };
    const promoProduct = allCards.find((p) => p.discount && p.discount > 0) ?? null;

    const imageAdverts = useMemo(() => {
        return apiAdverts
            .filter((a) => a && a.mediaType === 'IMAGE')
            .filter((a) => a.isActive !== false)
            .filter((a) => typeof a.id === 'string' && a.id.trim().length > 0)
            .filter((a) => typeof a.imageUrl === 'string' && a.imageUrl.trim().length > 0);
    }, [apiAdverts]);

    useEffect(() => {
        if (imageAdverts.length < 2) return;
        const t = window.setInterval(() => {
            setActiveAdvertIndex((i) => (i + 1) % imageAdverts.length);
        }, 4500);
        return () => window.clearInterval(t);
    }, [imageAdverts.length]);

    useEffect(() => {
        if (activeAdvertIndex >= imageAdverts.length) setActiveAdvertIndex(0);
    }, [activeAdvertIndex, imageAdverts.length]);

    const activeAdvert = imageAdverts.length > 0 ? imageAdverts[activeAdvertIndex % imageAdverts.length] : null;

    const leftCardTitle = activeAdvert?.title ?? heroProduct.name;
    const leftCardSub = activeAdvert ? 'Tap to view product' : heroProduct.category;
    const leftCardImage = activeAdvert
        ? (apiBaseUrl ? `${apiBaseUrl}/api/banners/${activeAdvert.id}/media` : (activeAdvert.imageUrl ?? ''))
        : (heroProduct.image || ringsImage);
    const leftCardImageHero = withCloudinaryTransform(leftCardImage, 'c_fill,g_auto,w_700,h_700,q_auto,f_auto');
    const leftCardLink = activeAdvert?.productLink ?? (heroProduct.id ? `/product/${heroProduct.id}` : '/products');

    const categoryChips = useMemo(() => {
        const chips = [{ name: 'All', icon: <FaFire size={16} /> }];
        apiCategories.forEach((c, i) => chips.push({ name: c.name, icon: CATEGORY_ICONS[i % CATEGORY_ICONS.length] }));
        return chips;
    }, [apiCategories]);

    /* Filtered trending for category chips */
    const filteredTrending = useMemo(() => {
        if (activeCategory === 'All') return trendingCards;
        return trendingCards.filter((p) => p.category.toLowerCase() === activeCategory.toLowerCase());
    }, [trendingCards, activeCategory]);

    return (
        <div className="bg-slate-50 min-h-screen pb-24 selection:bg-blue-600 selection:text-white">
            <div className="max-w-[1400px] mx-auto px-3 md:px-8 pt-4 md:pt-8">

                {/* Mobile-only adverts scroller (banner style like ProductCatalog top scroll) */}
                {imageAdverts.length > 0 && (
                    <section className="mb-4 lg:hidden">
                        <HorizontalScrollRow gap={1} showArrows>
                            {imageAdverts.map((a) => {
                                const src = apiBaseUrl
                                    ? `${apiBaseUrl}/api/banners/${a.id}/media`
                                    : (a.imageUrl ?? ringsImage);
                                const to = a.productLink || '/products';
                                const isExternal = /^https?:\/\//i.test(to);

                                const content = (
                                    <div className="relative w-[220px] sm:w-[250px] h-[130px] rounded-2xl overflow-hidden bg-slate-50 border border-gray-100 shadow-sm">
                                        <img
                                            src={src}
                                            alt={a.title || 'Belife rings'}
                                            className="w-full h-full object-contain"
                                            loading="lazy"
                                            decoding="async"
                                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = ringsImage; }}
                                        />

                                        {(a.title || '').trim().length > 0 && (
                                            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/55 via-black/20 to-transparent">
                                                <p className="m-0 text-blue-600 text-xs font-extrabold leading-tight">
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
                    </section>
                )}

                {/* ══════════ HERO ══════════ */}
                <section className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8 h-auto lg:h-[420px]">
                    {/* Left card */}
                    <div className="hidden lg:flex lg:col-span-1 bg-white rounded-2xl p-5 flex-col justify-between shadow-sm relative overflow-hidden">
                        <div>
                            <span className={`inline-block text-white text-[0.6rem] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-widest mb-3 ${activeAdvert ? 'bg-blue-600' : 'bg-amber-400'}`}>
                                {activeAdvert ? 'Advert' : 'New Arrival'}
                            </span>
                            <h2 className="text-xl font-extrabold text-slate-900 leading-tight mb-2">{leftCardTitle}</h2>
                            <p className="text-blue-600 font-bold text-sm">{leftCardSub}</p>
                        </div>

                        <Link
                            to={leftCardLink}
                            className="mt-4 p-3 rounded-xl hover:bg-slate-50 transition cursor-pointer no-underline"
                        >
                            <div className="w-full h-44 rounded-xl overflow-hidden shadow bg-slate-50">
                                <img
                                    src={leftCardImageHero}
                                    alt={leftCardTitle}
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                    decoding="async"
                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = ringsImage; }}
                                />
                            </div>

                            <div className="mt-3 min-w-0">
                                {activeAdvert ? (
                                    <p className="text-amber-500 font-extrabold text-base">Shop now</p>
                                ) : (
                                    <p className="text-amber-500 font-extrabold text-base">
                                        {heroProduct.currency === 'RWF' ? `RWF ${Math.round(heroProduct.price).toLocaleString()}` : `$${heroProduct.price.toFixed(2)}`}
                                        {heroProduct.oldPrice && (
                                            <span className="text-gray-400 text-xs font-medium line-through ml-2">
                                                {heroProduct.currency === 'RWF' ? `RWF ${Math.round(heroProduct.oldPrice).toLocaleString()}` : `$${heroProduct.oldPrice.toFixed(2)}`}
                                            </span>
                                        )}
                                    </p>
                                )}
                            </div>
                        </Link>

                        {/* Dot indicators */}
                        <div className="absolute top-5 right-5 flex gap-1">
                            {(imageAdverts.length > 0 ? imageAdverts : [0, 1, 2, 3]).map((_, i) => (
                                <span
                                    key={typeof _ === 'number' ? _ : (imageAdverts[i]?.id ?? i)}
                                    className={`w-1.5 h-1.5 rounded-full ${i === (activeAdvertIndex % Math.max(imageAdverts.length, 1)) ? 'bg-blue-600' : 'bg-gray-200'}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Centre hero image */}
                    <Link
                        to={heroProduct.id ? `/product/${heroProduct.id}` : '/products'}
                        className="lg:col-span-2 rounded-2xl overflow-hidden relative shadow-sm h-64 lg:h-auto group block no-underline"
                        style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb,#60a5fa)' }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10" />
                        <img
                            src={heroProduct.image}
                            alt={heroProduct.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = ringsImage; }}
                        />
                        <div className="absolute bottom-6 left-6 z-20">
                            <span className="inline-block bg-white/20 text-white text-[0.6rem] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm mb-2 uppercase tracking-widest">
                                {heroProduct.category || 'Featured'}
                            </span>
                            <h3 className="text-2xl md:text-3xl font-extrabold text-white drop-shadow-sm leading-tight">{heroProduct.name}</h3>
                            {heroProduct.discount && (
                                <span className="inline-block mt-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                                    -{heroProduct.discount}% OFF
                                </span>
                            )}
                        </div>
                    </Link>

                    {/* Right stacked banners */}
                    <div className="lg:col-span-1 flex flex-col gap-4">
                        {/* Promo card */}
                        <div className="flex-1 bg-white rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between group cursor-pointer"
                            onClick={() => promoProduct && window.location.assign(`/product/${promoProduct.id}`)}>
                            {promoProduct?.discount && (
                                <div className="absolute top-0 right-0 bg-red-500 text-white py-1 px-3 text-xs font-bold rounded-bl-xl rounded-tr-2xl z-10">
                                    -{promoProduct.discount}%
                                </div>
                            )}
                            <div>
                                <span className="inline-block bg-red-50 text-red-500 text-[0.6rem] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-widest mb-2">
                                    Hot Deal
                                </span>
                                <p className="text-[0.7rem] italic text-blue-600 font-semibold mb-1">{promoProduct?.category ?? (isLoading ? 'Loading…' : 'No promotions')}</p>
                                <h3 className="text-sm font-extrabold text-slate-800 leading-tight group-hover:text-blue-600 transition">
                                    {promoProduct ? promoProduct.name : isLoading ? 'Loading promotion…' : 'No discounted products yet'}
                                </h3>
                                {promoProduct && (
                                    <p className="text-amber-500 font-extrabold text-base mt-2">
                                        {promoProduct.currency === 'RWF' ? `RWF ${Math.round(promoProduct.price).toLocaleString()}` : `$${promoProduct.price.toFixed(2)}`}
                                    </p>
                                )}
                            </div>
                            <Link to="/products" className="inline-block mt-3 bg-blue-600 text-white text-xs font-bold py-2 px-4 rounded-full w-max hover:bg-blue-700 transition no-underline">
                                Browse All
                            </Link>
                            <img
                                src={promoProduct?.image ?? ringsImage}
                                alt=""
                                className="absolute -bottom-4 -right-4 w-24 h-24 object-cover rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = ringsImage; }}
                            />
                        </div>

                        {/* Sign-up incentive */}
                        <Link
                            to="/register"
                            className="flex-1 rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group no-underline"
                            style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)' }}
                        >
                            <div className="absolute w-32 h-32 border-4 border-white/10 rounded-full -top-8 -left-8 group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute w-24 h-24 border-4 border-white/10 rounded-full -bottom-6 -right-6 group-hover:scale-110 transition-transform duration-500" />
                            <div className="relative z-10">
                                <FaStar size={20} className="text-amber-400 mb-2 mx-auto" />
                                <p className="text-white text-xs font-semibold mb-0.5">Sign up & save</p>
                                <h3 className="text-2xl font-extrabold text-amber-400 mb-3">
                                    {promoProduct?.discount ? `-${promoProduct.discount}%` : 'Deals'}
                                </h3>
                                <span className="bg-white text-blue-700 text-xs font-extrabold py-2 px-5 rounded-full hover:bg-blue-50 transition shadow cursor-pointer">
                                    JOIN NOW
                                </span>
                            </div>
                        </Link>
                    </div>
                </section>

                {/* ══════════ CATEGORY CHIPS ══════════ */}
                <section className="mb-8">
                    <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {categoryChips.map((chip) => (
                            <button
                                key={chip.name}
                                onClick={() => setActiveCategory(chip.name)}
                                className="flex items-center gap-2 flex-shrink-0 px-4 py-2.5 rounded-full font-bold text-xs transition-all duration-200 cursor-pointer border-none shadow-sm"
                                style={{
                                    background: activeCategory === chip.name ? '#2563eb' : 'white',
                                    color: activeCategory === chip.name ? 'white' : '#334155',
                                    transform: activeCategory === chip.name ? 'scale(1.04)' : 'scale(1)',
                                    boxShadow: activeCategory === chip.name ? '0 4px 14px rgba(37,99,235,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
                                }}
                            >
                                <span>{chip.icon}</span>
                                {chip.name}
                            </button>
                        ))}
                    </div>
                </section>

                {/* ══════════ TRENDING (horizontal scroll) ══════════ */}
                <section className="mb-10">
                    <SectionHeader tag="🔥 Hot" title="Trending Now" seeAllHref="/products" />
                    {isLoading ? (
                        <HorizontalScrollRow gap={1} showArrows>
                            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
                        </HorizontalScrollRow>
                    ) : filteredTrending.length > 0 ? (
                        <HorizontalScrollRow gap={1} showArrows>
                            {filteredTrending.map((p) => (
                                <ProductCard key={p.id} product={p} variant="compact" />
                            ))}
                        </HorizontalScrollRow>
                    ) : (
                        <p className="text-sm text-gray-400 font-semibold py-4">No trending products yet.</p>
                    )}
                </section>

                {/* ══════════ NEW ARRIVALS (masonry/mixed grid) ══════════ */}
                <section className="mb-10">
                    <SectionHeader tag="✨ Fresh" title="New Arrivals" seeAllHref="/products" />
                    {isLoading ? (
                        <GridSkeleton />
                    ) : newArrivalsDisplay.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px border border-gray-200 overflow-hidden shadow-sm">
                            {newArrivalsDisplay.map((p, index) => (
                                <ProductCard
                                    key={p.id}
                                    product={p}
                                    variant="default"
                                    featured={index === 0}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 font-semibold py-4">No new arrivals yet.</p>
                    )}
                </section>

                {/* ══════════ RECOMMENDED (horizontal scroll) ══════════ */}
                <section className="mb-10">
                    <SectionHeader tag="🤖 AI Pick" title="Recommended For You" seeAllHref="/products" />
                    {isLoading ? (
                        <HorizontalScrollRow gap={1} showArrows>
                            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
                        </HorizontalScrollRow>
                    ) : recommendedCards.length > 0 ? (
                        <HorizontalScrollRow gap={1} showArrows>
                            {recommendedCards.map((p) => (
                                <ProductCard key={p.id} product={p} variant="compact" />
                            ))}
                        </HorizontalScrollRow>
                    ) : (
                        <p className="text-sm text-gray-400 font-semibold py-4">No recommendations yet.</p>
                    )}
                </section>

            </div>

            {/* Sticky mobile bottom nav */}
            <MobileBottomNav />
        </div>
    );
};

export default Homepage;