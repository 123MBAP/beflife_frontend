import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaSearch, FaBars, FaTimes, FaUserCircle } from 'react-icons/fa';
import { FiShoppingCart, FiChevronDown } from 'react-icons/fi';
import mbiLogo from '../images/mbi.png';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../context/AuthContext';

type NavbarCategory = {
    id: string;
    name: string;
};

type NavbarProduct = {
    id: string;
    name: string;
    description?: string;
    category?: string;
};

type SearchSuggestion =
    | { type: 'product'; id: string; label: string; subLabel?: string; score: number }
    | { type: 'category'; id: string; label: string; score: number };

const CURRENCY_STORAGE_KEY = 'belifeCurrency';
const DEFAULT_CURRENCY = 'RWF';

const readStoredCurrency = () => {
    try {
        const v = localStorage.getItem(CURRENCY_STORAGE_KEY);
        if (v === 'RWF') return 'RWF';
    } catch {
        // ignore
    }
    return DEFAULT_CURRENCY;
};

const persistCurrency = (currency: string) => {
    try {
        localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    } catch {
        // ignore
    }
    window.dispatchEvent(new CustomEvent('currency:changed', { detail: currency }));
};

const formatMoney = (amount: number, currency: string) => {
    const c = currency === 'RW2F' ? 'RWF' : currency;
    if (c === 'RWF') {
        return `RWF ${Math.round(amount).toLocaleString()}`;
    }
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const Navbar = () => {
    const { totalItems, totalAmount } = useCart();
    const { user, isAuthenticated, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
    const [isCategoryMenuPinned, setIsCategoryMenuPinned] = useState(false);
    const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
    const cartCount = totalItems;

    const categoryMenuRef = useRef<HTMLDivElement | null>(null);
    const categoryMenuCloseTimeoutRef = useRef<number | null>(null);

    const searchBoxDesktopRef = useRef<HTMLDivElement | null>(null);
    const searchBoxMobileRef = useRef<HTMLDivElement | null>(null);

    const apiBaseUrl = useMemo(() => (process.env.REACT_APP_API_URL ?? '').replace(/\/$/, ''), []);
    const [showroomHidden, setShowroomHidden] = useState(true);
    const [categories, setCategories] = useState<NavbarCategory[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [categoriesError, setCategoriesError] = useState<string | null>(null);

    const [searchValue, setSearchValue] = useState('');
    const [products, setProducts] = useState<NavbarProduct[]>([]);
    const [productsLoaded, setProductsLoaded] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);

    const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);
    const [currencyOpen, setCurrencyOpen] = useState(false);
    const currencyRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const stored = readStoredCurrency();
        setCurrency(stored);
        persistCurrency(stored);
    }, []);

    useEffect(() => {
        if (!currencyOpen) return;
        const handlePointerDown = (e: MouseEvent) => {
            const el = currencyRef.current;
            if (!el) return;
            if (!el.contains(e.target as Node)) {
                setCurrencyOpen(false);
            }
        };
        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, [currencyOpen]);

    useEffect(() => {
        setIsMenuOpen(false);
        setIsCategoryMenuOpen(false);
        setIsCategoryMenuPinned(false);
        setIsMobileCategoriesOpen(false);
        setSearchOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const load = async () => {
            if (!apiBaseUrl) return;
            try {
                const res = await fetch(`${apiBaseUrl}/api/ui-config`);
                const data = await res.json().catch(() => ({}));
                if (res.ok && data?.ok) {
                    setShowroomHidden(Boolean(data?.config?.showroomHidden));
                }
            } catch {
                // ignore
            }
        };
        load();
    }, [apiBaseUrl]);

    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const normalizeTight = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

    const levenshtein = (a: string, b: string) => {
        const alen = a.length;
        const blen = b.length;
        if (alen === 0) return blen;
        if (blen === 0) return alen;

        const dp = new Array(blen + 1).fill(0).map((_, i) => i);
        for (let i = 1; i <= alen; i++) {
            let prev = dp[0];
            dp[0] = i;
            for (let j = 1; j <= blen; j++) {
                const tmp = dp[j];
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                dp[j] = Math.min(
                    dp[j] + 1,
                    dp[j - 1] + 1,
                    prev + cost
                );
                prev = tmp;
            }
        }
        return dp[blen];
    };

    const scoreMatch = (query: string, candidate: string) => {
        const q = normalize(query);
        const c = normalize(candidate);
        const qt = normalizeTight(query);
        const ct = normalizeTight(candidate);

        if (!q) return 0;
        if (ct === qt) return 1;
        if (ct.startsWith(qt)) return 0.95;
        if (ct.includes(qt)) return 0.9;
        if (c.startsWith(q)) return 0.85;
        if (c.includes(q)) return 0.8;

        // Fuzzy: allow small typos like "belbot" vs "bellbot".
        if (qt.length >= 4 && ct.length >= 4) {
            const ratioWhole = 1 - levenshtein(qt, ct) / Math.max(qt.length, ct.length);

            // If candidate is long, also compare against each token (and 2-token combos)
            // so queries can still match a part of a longer name.
            let best = ratioWhole;
            if (best < 0.72) {
                const tokens = c.split(' ').filter(Boolean).map(normalizeTight).filter(Boolean);
                for (let i = 0; i < tokens.length; i++) {
                    const t1 = tokens[i];
                    best = Math.max(best, 1 - levenshtein(qt, t1) / Math.max(qt.length, t1.length));
                    if (i + 1 < tokens.length) {
                        const t2 = `${tokens[i]}${tokens[i + 1]}`;
                        best = Math.max(best, 1 - levenshtein(qt, t2) / Math.max(qt.length, t2.length));
                    }
                }
            }

            return best >= 0.72 ? best : 0;
        }
        return 0;
    };

    const submitSearch = () => {
        const q = searchValue.trim();
        if (!q) return;

        const params = new URLSearchParams();
        params.set('q', q);

        // Keep current category filter if user is already browsing products.
        if (location.pathname === '/products') {
            const existing = new URLSearchParams(location.search).get('category');
            if (existing?.trim()) params.set('category', existing);
        }

        navigate(`/products?${params.toString()}`);
        setIsMenuOpen(false);
        setSearchOpen(false);
    };

    const loadProductsOnce = async () => {
        if (productsLoaded) return;
        if (!apiBaseUrl) return;
        try {
            const res = await fetch(`${apiBaseUrl}/api/products`);
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data?.ok) return;

            const list = Array.isArray(data?.products) ? data.products : [];
            setProducts(
                list
                    .filter((p: any) => p?.id && p?.name)
                    .map((p: any) => ({
                        id: String(p.id),
                        name: String(p.name),
                        description: p?.description ? String(p.description) : undefined,
                        category: p?.category ? String(p.category) : undefined,
                    }))
            );
            setProductsLoaded(true);
        } catch {
            // ignore
        }
    };

    const recomputeSuggestions = (q: string) => {
        const query = q.trim();
        if (!query) {
            setSearchSuggestions([]);
            return;
        }

        const suggestions: SearchSuggestion[] = [];

        for (const c of categories) {
            const s = scoreMatch(query, c.name);
            if (s > 0) suggestions.push({ type: 'category', id: c.id, label: c.name, score: s });
        }

        for (const p of products) {
            const s1 = scoreMatch(query, p.name);
            const s2 = p.description ? scoreMatch(query, p.description) * 0.65 : 0;
            const s3 = p.category ? scoreMatch(query, p.category) * 0.7 : 0;
            const s = Math.max(s1, s2, s3);
            if (s > 0) {
                suggestions.push({
                    type: 'product',
                    id: p.id,
                    label: p.name,
                    subLabel: p.category,
                    score: s,
                });
            }
        }

        suggestions.sort((a, b) => b.score - a.score);
        setSearchSuggestions(suggestions.slice(0, 10));
    };

    const handleSuggestionPick = (s: SearchSuggestion) => {
        if (s.type === 'product') {
            navigate(`/product/${s.id}`);
        } else {
            navigate(`/products?category=${encodeURIComponent(s.label)}`);
        }
        setSearchOpen(false);
        setIsMenuOpen(false);
    };

    useEffect(() => {
        if (!searchOpen) return;
        if (!searchValue.trim()) return;
        recomputeSuggestions(searchValue);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categories, products]);

    useEffect(() => {
        if (!searchOpen) return;

        const handlePointerDown = (e: MouseEvent) => {
            const desktopEl = searchBoxDesktopRef.current;
            const mobileEl = searchBoxMobileRef.current;
            const target = e.target as Node;

            const insideDesktop = desktopEl ? desktopEl.contains(target) : false;
            const insideMobile = mobileEl ? mobileEl.contains(target) : false;

            if (!insideDesktop && !insideMobile) setSearchOpen(false);
        };

        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, [searchOpen]);

    const clearCategoryMenuCloseTimeout = () => {
        if (categoryMenuCloseTimeoutRef.current !== null) {
            window.clearTimeout(categoryMenuCloseTimeoutRef.current);
            categoryMenuCloseTimeoutRef.current = null;
        }
    };

    const scheduleCategoryMenuClose = () => {
        if (isCategoryMenuPinned) return;
        clearCategoryMenuCloseTimeout();
        categoryMenuCloseTimeoutRef.current = window.setTimeout(() => {
            setIsCategoryMenuOpen(false);
        }, 150);
    };

    useEffect(() => {
        if (!isCategoryMenuOpen) return;

        const handlePointerDown = (e: MouseEvent) => {
            const el = categoryMenuRef.current;
            if (!el) return;
            if (!el.contains(e.target as Node)) {
                setIsCategoryMenuOpen(false);
                setIsCategoryMenuPinned(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        return () => document.removeEventListener('mousedown', handlePointerDown);
    }, [isCategoryMenuOpen]);

    useEffect(() => {
        const load = async () => {
            if (!apiBaseUrl) return;

            setCategoriesLoading(true);
            setCategoriesError(null);
            try {
                const res = await fetch(`${apiBaseUrl}/api/categories`);
                const data = await res.json().catch(() => ({}));
                if (!res.ok || !data?.ok) {
                    throw new Error(data?.error || 'Failed to load categories');
                }
                setCategories(Array.isArray(data?.categories) ? data.categories : []);
            } catch (err: any) {
                setCategoriesError(err?.message || 'Failed to load categories');
            } finally {
                setCategoriesLoading(false);
            }
        };

        load();
    }, [apiBaseUrl]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isAdmin = Boolean((user as any)?.isAdmin || (user as any)?.role === 'ADMIN');

    const handleLogout = () => {
        logout();
        setIsMenuOpen(false);
    };

    return (
        <div className="bg-white sticky top-0 z-50 shadow-sm font-outfit py-3 lg:py-0 w-full relative">
            {/* --- TOP HEADER ROW --- */}
            <div className="flex items-center justify-between py-4 lg:py-5 border-b border-foodco-green-light px-4 sm:px-6 lg:px-12">
                {/* Logo & Dropdowns Container */}
                <div className="flex items-center gap-6">
                    {/* Small dropdowns - hidden on mobile */}
                    <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-foodco-gray uppercase px-4 py-1.5 border border-gray-200 rounded-full" ref={currencyRef}>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setCurrencyOpen((v) => !v)}
                                className="flex items-center gap-1 cursor-pointer hover:text-foodco-green transition bg-transparent border-none p-0 uppercase"
                            >
                                {currency} <FiChevronDown size={14} />
                            </button>

                            {currencyOpen && (
                                <div className="absolute left-0 top-full mt-2 min-w-[140px] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCurrency('RWF');
                                            persistCurrency('RWF');
                                            setCurrencyOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-foodco-bg transition text-xs font-semibold text-foodco-text"
                                    >
                                        RWF
                                    </button>
                                </div>
                            )}
                        </div>
                        <span className="w-px h-3 bg-gray-300"></span>
                        {/* <span className="flex items-center gap-1 cursor-pointer hover:text-foodco-green transition">
                            ENGLISH <FiChevronDown size={14} />
                        </span> */}
                    </div>

                    {/* Logo (Centered on mobile if we wanted, but flex keeps it aligned) */}
                    <Link to="/" className="flex items-center gap-2 no-underline text-foodco-green hover:opacity-90 transition shrink-0">
                        <img src={mbiLogo} alt="MBI Logo" className="h-8 sm:h-12 w-auto object-contain" />
                        <span className="text-xl sm:text-2xl font-bold tracking-tight text-foodco-green leading-none whitespace-nowrap">
                            BeLife Store
                        </span>
                    </Link>
                </div>

                {/* Search Bar - hidden on strictly small screens */}
                <div className="hidden md:flex flex-1 max-w-xl mx-8 relative" ref={searchBoxDesktopRef}>
                    <FiChevronDown size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchValue}
                        onFocus={() => {
                            setSearchOpen(true);
                            loadProductsOnce();
                            recomputeSuggestions(searchValue);
                        }}
                        onChange={(e) => {
                            const v = e.target.value;
                            setSearchValue(v);
                            setSearchOpen(true);
                            loadProductsOnce();
                            recomputeSuggestions(v);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                submitSearch();
                            }
                            if (e.key === 'Escape') {
                                setSearchOpen(false);
                            }
                        }}
                        className="w-full bg-foodco-bg rounded-full py-3.5 pl-12 pr-12 text-sm text-foodco-text border-none outline-none focus:ring-2 focus:ring-foodco-green/30 transition-shadow"
                    />
                    <button
                        type="button"
                        onClick={submitSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-foodco-green p-1 transition"
                        aria-label="Search"
                    >
                        <FaSearch size={16} />
                    </button>

                    {searchOpen && searchValue.trim() && searchSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50">
                            <div className="px-4 py-2 text-[0.65rem] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-50">
                                Suggestions
                            </div>
                            <div className="max-h-80 overflow-auto">
                                {searchSuggestions.map((sug, idx) => (
                                    <button
                                        key={`${sug.type}-${sug.id}-${idx}`}
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => handleSuggestionPick(sug)}
                                        className="w-full text-left px-4 py-3 hover:bg-foodco-bg transition flex items-center justify-between"
                                    >
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold text-foodco-text truncate">
                                                {sug.label}
                                            </div>
                                            {'subLabel' in sug && sug.subLabel ? (
                                                <div className="text-xs text-gray-400 truncate">{sug.subLabel}</div>
                                            ) : (
                                                <div className="text-xs text-gray-400 truncate">{sug.type === 'category' ? 'Category' : 'Product'}</div>
                                            )}
                                        </div>
                                        <div className="text-[0.65rem] font-bold text-foodco-green bg-foodco-light-green px-2 py-1 rounded-full shrink-0">
                                            {sug.type}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>



                {/* Right Side Icons */}
                <div className="flex items-center gap-4 lg:gap-6">
                    {/* Price and Cart */}
                    <Link to="/cart" className="hidden lg:flex items-center gap-3 no-underline group cursor-pointer">
                        <span className="text-sm font-semibold text-foodco-text">
                            {formatMoney(totalAmount, currency)}
                        </span>
                        <div className="relative p-2 bg-foodco-light-green rounded-full text-foodco-green group-hover:bg-foodco-green group-hover:text-white transition">
                            <FiShoppingCart size={20} />
                            <span className="absolute -top-1 -right-1 bg-foodco-yellow text-white text-[0.65rem] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
                                {cartCount > 99 ? '99+' : cartCount}
                            </span>
                        </div>
                    </Link>

                    {/* Wishlist */}
                    {/* <div className="hidden lg:flex relative p-2 text-foodco-gray hover:text-foodco-green cursor-pointer transition">
                        <FaRegHeart size={22} />
                        <span className="absolute top-1 -right-0 bg-foodco-red text-white text-[0.65rem] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center">
                            1
                        </span>
                    </div> */}

                    {/* User Profile */}
                    <div className="hidden lg:flex items-center gap-2 cursor-pointer group relative">
                        <div className="text-right">
                            <p className="text-xs text-foodco-gray m-0">Hello,</p>
                            <p className="text-sm font-semibold text-foodco-text m-0 group-hover:text-foodco-green transition">
                                {isAuthenticated ? (user?.name?.split(' ')[0] || 'User') : 'Guest'}
                            </p>
                        </div>
                        <div className="flex items-center text-foodco-gray group-hover:text-foodco-green transition">
                            <FaUserCircle size={32} className="text-gray-300 ml-1" />
                            <FiChevronDown size={14} className="ml-1" />
                        </div>

                        {/* Dropdown Menu */}
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right">
                            <div className="p-2 flex flex-col gap-1">
                                {isAuthenticated ? (
                                    <>
                                        <Link to="/profile" className="px-4 py-2 text-sm text-foodco-text hover:bg-foodco-light-green hover:text-foodco-green rounded-lg transition no-underline">Profile</Link>
                                        <Link to="/orders" className="px-4 py-2 text-sm text-foodco-text hover:bg-foodco-light-green hover:text-foodco-green rounded-lg transition no-underline">Orders</Link>
                                        {isAdmin && (
                                            <Link to="/admin" className="px-4 py-2 text-sm text-foodco-text hover:bg-foodco-light-green hover:text-foodco-green rounded-lg transition no-underline">Admin Dashboard</Link>
                                        )}
                                        <div className="h-px bg-gray-100 my-1 mx-2"></div>
                                        <button onClick={handleLogout} className="text-left px-4 py-2 text-sm text-foodco-red hover:bg-red-50 rounded-lg transition cursor-pointer border-none bg-transparent">Logout</button>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/login" className="px-4 py-2 text-sm text-foodco-text hover:bg-foodco-light-green hover:text-foodco-green rounded-lg transition no-underline">Login</Link>
                                        <Link to="/register" className="px-4 py-2 text-sm text-foodco-text hover:bg-foodco-light-green hover:text-foodco-green rounded-lg transition no-underline">Register</Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="flex lg:hidden items-center gap-4">
                        <Link to="/cart" className="relative p-2 text-foodco-green no-underline">
                            <FiShoppingCart size={22} />
                            {cartCount > 0 && (
                                <span className="absolute top-0 right-0 bg-foodco-yellow text-white text-[0.6rem] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center">
                                    {cartCount > 99 ? '99+' : cartCount}
                                </span>
                            )}
                        </Link>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="bg-foodco-light-green text-foodco-green p-2 rounded-lg border-none"
                        >
                            {isMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MOBILE SEARCH BAR (Second Nav) --- */}
            <div className="flex md:hidden px-4 pb-4 bg-white border-b border-foodco-bg">
                <div className="relative w-full" ref={searchBoxMobileRef}>
                    <FiChevronDown size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="search"
                        placeholder="Search products..."
                        value={searchValue}
                        onFocus={() => {
                            setSearchOpen(true);
                            loadProductsOnce();
                            recomputeSuggestions(searchValue);
                        }}
                        onChange={(e) => {
                            const v = e.target.value;
                            setSearchValue(v);
                            setSearchOpen(true);
                            loadProductsOnce();
                            recomputeSuggestions(v);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                submitSearch();
                            }
                            if (e.key === 'Escape') {
                                setSearchOpen(false);
                            }
                        }}
                        className="w-full bg-foodco-bg rounded-full py-3 pl-12 pr-12 text-sm text-foodco-text border-none outline-none focus:ring-2 focus:ring-foodco-green/30 transition-shadow appearance-none"
                    />
                    <button
                        type="button"
                        onClick={submitSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-foodco-green p-1 transition"
                        aria-label="Search"
                    >
                        <FaSearch size={16} />
                    </button>

                    {searchOpen && searchValue.trim() && searchSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50">
                            <div className="px-4 py-2 text-[0.65rem] font-bold uppercase tracking-widest text-gray-400 border-b border-gray-50">
                                Suggestions
                            </div>
                            <div className="max-h-80 overflow-auto">
                                {searchSuggestions.map((sug, idx) => (
                                    <button
                                        key={`${sug.type}-${sug.id}-${idx}`}
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => handleSuggestionPick(sug)}
                                        className="w-full text-left px-4 py-3 hover:bg-foodco-bg transition flex items-center justify-between"
                                    >
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold text-foodco-text truncate">
                                                {sug.label}
                                            </div>
                                            {'subLabel' in sug && sug.subLabel ? (
                                                <div className="text-xs text-gray-400 truncate">{sug.subLabel}</div>
                                            ) : (
                                                <div className="text-xs text-gray-400 truncate">{sug.type === 'category' ? 'Category' : 'Product'}</div>
                                            )}
                                        </div>
                                        <div className="text-[0.65rem] font-bold text-foodco-green bg-foodco-light-green px-2 py-1 rounded-full shrink-0">
                                            {sug.type}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- BOTTOM NAVIGATION ROW --- */}
            <div className="hidden lg:flex items-center justify-between py-2 border-b border-foodco-bg">
                <div className="flex items-center h-full">
                    {/* Category Dropdown & Divider Wrapper */}
                    <div
                        className="relative flex items-center h-full"
                        ref={categoryMenuRef}
                        onMouseEnter={() => {
                            clearCategoryMenuCloseTimeout();
                            setIsCategoryMenuOpen(true);
                        }}
                        onMouseLeave={() => {
                            scheduleCategoryMenuClose();
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                clearCategoryMenuCloseTimeout();
                                setIsCategoryMenuOpen((prev) => {
                                    const next = !prev;
                                    setIsCategoryMenuPinned(next);
                                    return next;
                                });
                            }}
                            aria-haspopup="menu"
                            aria-expanded={isCategoryMenuOpen}
                            className="flex items-center gap-2 bg-transparent border-none text-sm font-semibold text-foodco-text hover:text-foodco-green cursor-pointer py-3 transition pl-4 sm:pl-6 lg:pl-12 pr-6"
                        >
                            <FaBars size={18} />
                            Select Category
                            <FiChevronDown size={14} />
                        </button>

                        <div className="w-px h-5 bg-gray-200"></div>

                        <div
                            className={`absolute top-full left-0 w-full bg-white shadow-lg border-x border-b border-gray-100 overflow-hidden transition-all ${isCategoryMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-1 pointer-events-none'
                                }`}
                            role="menu"
                            onMouseEnter={() => {
                                clearCategoryMenuCloseTimeout();
                            }}
                            onMouseLeave={() => {
                                scheduleCategoryMenuClose();
                            }}
                        >
                            <div className="p-2 flex flex-col gap-1">
                                {categoriesLoading && (
                                    <div className="px-4 py-2 text-sm text-gray-500 flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-foodco-green border-t-transparent rounded-full animate-spin" />
                                        Loading...
                                    </div>
                                )}

                                {!categoriesLoading && categoriesError && (
                                    <div className="px-4 py-2 text-sm text-foodco-red">{categoriesError}</div>
                                )}

                                {!categoriesLoading && !categoriesError && categories.length === 0 && (
                                    <div className="px-4 py-2 text-sm text-gray-500">No categories yet</div>
                                )}

                                {!categoriesLoading && !categoriesError && categories.map((cat) => (
                                    <Link
                                        key={cat.id}
                                        to={`/products?category=${encodeURIComponent(cat.name)}`}
                                        onClick={() => {
                                            setIsCategoryMenuOpen(false);
                                            setIsCategoryMenuPinned(false);
                                        }}
                                        role="menuitem"
                                        className="px-4 py-2 text-sm text-foodco-text hover:bg-foodco-light-green hover:text-foodco-green rounded-lg transition no-underline"
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Nav Links container with remaining padding */}
                    <nav className="flex items-center gap-8 pl-8">
                        <Link to="/products" className="text-sm font-medium text-foodco-gray hover:text-foodco-green no-underline transition">
                            Available Products
                        </Link>
                        {/* <Link to="/products" className="text-sm font-medium text-foodco-gray hover:text-foodco-green no-underline transition">
                            Best Sales
                        </Link> */}
                        <Link to="/" className="text-sm font-medium text-foodco-gray hover:text-foodco-green no-underline transition relative">
                            Promotions
                        </Link>
                        {!showroomHidden && (
                            <Link to="/showroom" className="text-sm font-medium text-foodco-gray hover:text-foodco-green no-underline transition">
                                Showroom
                            </Link>
                        )}

                        {isAuthenticated && (
                            <>
                                <Link to="/orders" className="text-sm font-medium text-foodco-gray hover:text-foodco-green no-underline transition">
                                    Orders
                                </Link>
                                {isAdmin && (
                                    <Link to="/admin" className="text-sm font-medium text-foodco-gray hover:text-foodco-green no-underline transition">
                                        Admin Dashboard
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>
                </div>

                {/* Right Side Support Context */}
                <div className="flex items-center gap-5 text-sm font-medium text-foodco-gray px-4 sm:px-6 lg:px-12">
                    <Link to="/support" className="text-sm font-medium text-foodco-gray hover:text-foodco-green no-underline transition">
                        Support
                    </Link>
                    <a href="mailto:info@mbitechnova.com" className="text-foodco-gray hover:text-foodco-green no-underline transition">
                        info@mbitechnova.com
                    </a>
                    <span className="flex items-center gap-2 text-foodco-green font-semibold">
                        +250791689396
                    </span>

                </div>
            </div>

            {/* --- MOBILE OVL MENU --- */}
            <div className={`fixed inset-0 bg-white z-40 transform transition-transform duration-300 lg:hidden px-4 sm:px-6 ${isMenuOpen ? 'translate-y-[70px]' : 'translate-y-full opacity-0 pointer-events-none'}`}>
                <div className="p-6 h-[calc(100vh-70px)] overflow-y-auto">
                    {/* Mobile Search */}
                    <div className="relative mb-6">
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full bg-foodco-bg rounded-lg py-3 pl-4 pr-10 text-sm border-none outline-none focus:ring-2 focus:ring-foodco-green/30"
                        />
                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                            <FaSearch />
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsMobileCategoriesOpen((v) => !v)}
                        className="py-3 px-4 text-base font-semibold border-b border-gray-100 text-foodco-text gap-2 bg-transparent border-l-0 border-r-0 border-t-0 flex items-center justify-between"
                        aria-expanded={isMobileCategoriesOpen}
                    >
                        <FaBars size={18} />
                        Select Category
                        <FiChevronDown size={18} className={`transition-transform ${isMobileCategoriesOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isMobileCategoriesOpen && (
                        <div className="-mt-1 pb-2 border-b border-gray-100  flex flex-col gap-1">
                            {categoriesLoading && (
                                <div className="px-4 py-2 text-sm text-gray-500 flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-foodco-green border-t-transparent rounded-full animate-spin" />
                                    Loading...
                                </div>
                            )}

                            {!categoriesLoading && categoriesError && (
                                <div className="px-4 py-2 text-sm text-foodco-red">{categoriesError}</div>
                            )}

                            {!categoriesLoading && !categoriesError && categories.length === 0 && (
                                <div className="px-4 py-2 text-sm text-gray-500">No categories yet</div>
                            )}

                            {!categoriesLoading && !categoriesError && categories.map((cat) => (
                                <Link
                                    key={cat.id}
                                    to={`/products?category=${encodeURIComponent(cat.name)}`}
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        setIsMobileCategoriesOpen(false);
                                    }}
                                    className="block py-2 px-8 text-sm font-semibold text-foodco-text no-underline hover:text-foodco-green"
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <Link to="/" onClick={() => setIsMenuOpen(false)} className="py-3 px-4 text-base font-semibold border-b border-gray-100 text-foodco-text no-underline">Home</Link>
                        <Link to="/products" onClick={() => setIsMenuOpen(false)} className="py-3 px-4 text-base font-semibold border-b border-gray-100 text-foodco-text no-underline">New Products</Link>



                        <Link to="/products" onClick={() => setIsMenuOpen(false)} className="py-3 px-4 text-base font-semibold border-b border-gray-100 text-foodco-text no-underline flex items-center justify-between">
                            Promotions
                        </Link>
                        {!showroomHidden && (
                            <Link to="/showroom" onClick={() => setIsMenuOpen(false)} className="py-3 px-4 text-base font-semibold border-b border-gray-100 text-foodco-text no-underline">Showroom</Link>
                        )}

                        {isAuthenticated ? (
                            <>
                                <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="py-3 px-4 text-base font-semibold border-b border-gray-100 text-foodco-text no-underline flex items-center gap-2">
                                    Profile
                                </Link>
                                <Link to="/orders" onClick={() => setIsMenuOpen(false)} className="py-3 px-4 text-base font-semibold border-b border-gray-100 text-foodco-text no-underline">Orders</Link>
                                {isAdmin && (
                                    <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="py-3 px-4 text-base font-semibold border-b border-gray-100 text-foodco-text no-underline">Admin Dashboard</Link>
                                )}
                                <button onClick={handleLogout} className="text-left py-3 px-4 text-base font-semibold text-foodco-red bg-transparent border-none mt-2">
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="py-3 px-4 text-base font-semibold border-b border-gray-100 text-foodco-text no-underline">Login</Link>
                                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="py-3 px-4 text-base font-semibold border-b border-gray-100 text-foodco-text no-underline">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
