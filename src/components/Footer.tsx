import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaTwitter, FaInstagram, FaEnvelope, FaPhone, FaMapMarkerAlt, FaLinkedin } from 'react-icons/fa';

type FooterCategory = {
    id: string;
    name: string;
};

const Footer = () => {
    const apiBaseUrl = useMemo(() => (process.env.REACT_APP_API_URL ?? '').replace(/\/$/, ''), []);
    const [categories, setCategories] = useState<FooterCategory[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadCategories = async () => {
            if (!apiBaseUrl) return;
            setLoading(true);
            try {
                const res = await fetch(`${apiBaseUrl}/api/categories`);
                const data = await res.json().catch(() => ({}));
                if (res.ok && data?.ok && Array.isArray(data?.categories)) {
                    setCategories(data.categories.slice(0, 4)); // Get first 4 categories
                }
            } catch (err) {
                console.error('Failed to load footer categories:', err);
            } finally {
                setLoading(false);
            }
        };

        loadCategories();
    }, [apiBaseUrl]);

    return (
        <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800 font-outfit mt-auto">
            <div className="max-w-[1400px] w-full mx-auto px-6 md:px-8">
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-12">
                    
                    {/* Brand Info */}
                    <div>
                        <Link to="/" className="flex items-center gap-2 no-underline text-white mb-6 hover:opacity-90 transition">
                            <span className="text-3xl font-bold tracking-tight text-white leading-none">
                                Be Life Store
                            </span>
                        </Link>
                        <p className="text-slate-400 leading-relaxed mb-6 text-sm">
                            Your trusted destination for premium electronics, smart devices, and daily essentials. Experience quality and innovation with MBI Technova's curated selection.
                        </p>

                        <div className="flex items-center gap-3">
                            <a
                                href="https://www.linkedin.com/in/lewis-birikumana-09b814401"
                                target="_blank"
                                rel="noreferrer"
                                aria-label="LinkedIn"
                                className="w-10 h-10 rounded-full bg-slate-800 text-slate-300 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                            >
                                <FaLinkedin size={18} />
                            </a>
                            <a
                                href="https://x.com/BiriRewis"
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Twitter"
                                className="w-10 h-10 rounded-full bg-slate-800 text-slate-300 hover:bg-blue-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                            >
                                <FaTwitter size={18} />
                            </a>
                            <a
                                href="https://www.instagram.com/mbi_technova_offcial?igsh=MXZoam5vM3J0ZzBiNg=="
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Instagram"
                                className="w-10 h-10 rounded-full bg-slate-800 text-slate-300 hover:bg-pink-600 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                            >
                                <FaInstagram size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 text-white">Quick Links</h3>
                        <nav className="flex flex-col gap-3">
                            <Link to="/" className="text-sm font-medium text-slate-400 hover:text-blue-400 transition-colors no-underline">
                                Home
                            </Link>
                            <Link to="/products" className="text-sm font-medium text-slate-400 hover:text-blue-400 transition-colors no-underline">
                                Products
                            </Link>
                            <Link to="/support" className="text-sm font-medium text-slate-400 hover:text-blue-400 transition-colors no-underline">
                                Customer Support
                            </Link>
                            <Link to="/orders" className="text-sm font-medium text-slate-400 hover:text-blue-400 transition-colors no-underline">
                                Order Tracking
                            </Link>
                        </nav>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 text-white">Categories</h3>
                        <nav className="flex flex-col gap-3">
                            {loading ? (
                                <div className="space-y-2">
                                    <div className="h-4 w-24 bg-slate-800 animate-pulse rounded"></div>
                                    <div className="h-4 w-32 bg-slate-800 animate-pulse rounded"></div>
                                    <div className="h-4 w-20 bg-slate-800 animate-pulse rounded"></div>
                                </div>
                            ) : categories.length > 0 ? (
                                categories.map((cat) => (
                                    <Link 
                                        key={cat.id} 
                                        to={`/products?category=${encodeURIComponent(cat.name)}`} 
                                        className="text-sm font-medium text-slate-400 hover:text-blue-400 transition-colors no-underline"
                                    >
                                        {cat.name}
                                    </Link>
                                ))
                            ) : (
                                <>
                                    <Link to="/products?category=Smart" className="text-sm font-medium text-slate-400 hover:text-blue-400 transition-colors no-underline">
                                        Smart Devices
                                    </Link>
                                    <Link to="/products?category=Electronics" className="text-sm font-medium text-slate-400 hover:text-blue-400 transition-colors no-underline">
                                        Electronics
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 text-white">Contact Info</h3>
                        <div className="flex flex-col gap-4 text-sm font-medium text-slate-400">
                            <p className="flex items-start gap-3 m-0 hover:text-blue-400 transition-colors">
                                <FaEnvelope className="shrink-0 mt-1 text-blue-400" />
                                <span>info@mbitechnova.com</span>
                            </p>
                            <p className="flex items-start gap-3 m-0 hover:text-blue-400 transition-colors">
                                <FaPhone className="shrink-0 mt-1 text-blue-400" />
                                <span>+250791689396</span>
                            </p>
                            <p className="flex items-start gap-3 m-0 hover:text-blue-400 transition-colors">
                                <FaMapMarkerAlt className="shrink-0 mt-1 text-blue-400" />
                                <span className="leading-relaxed">Nyarugenge-Kimisagara<br />Kigali, Rwanda</span>
                            </p>
                        </div>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center text-slate-500 text-sm font-medium">
                    <p className="m-0">&copy; {new Date().getFullYear()} MBI Store. All rights reserved.</p>
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                        <Link to="/privacy" className="text-slate-500 hover:text-blue-400 no-underline transition-colors">Privacy Policy</Link>
                        <Link to="/terms" className="text-slate-500 hover:text-blue-400 no-underline transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;