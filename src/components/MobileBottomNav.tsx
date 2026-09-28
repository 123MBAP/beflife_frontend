import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiGrid, FiShoppingCart, FiUser } from 'react-icons/fi';
import { CartContext } from '../contexts/CartContext';

type NavItem = {
    to: string;
    icon: React.ReactNode;
    label: string;
    badge?: number;
};

/**
 * Sticky bottom navigation bar — visible only on mobile (hidden on md+).
 * Provides quick access to Home, Products, Cart, and Profile.
 */
const MobileBottomNav: React.FC = () => {
    const location = useLocation();
    const { cartItems } = useContext(CartContext);
    const cartCount = cartItems?.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0) ?? 0;

    const navItems: NavItem[] = [
        { to: '/', icon: <FiHome size={20} />, label: 'Home' },
        { to: '/products', icon: <FiGrid size={20} />, label: 'Shop' },
        { to: '/cart', icon: <FiShoppingCart size={20} />, label: 'Cart', badge: cartCount },
        { to: '/profile', icon: <FiUser size={20} />, label: 'Profile' },
    ];

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
            {/* Glassmorphism background */}
            <div
                className="flex items-center justify-around border-t border-gray-100"
                style={{
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                }}
            >
                {navItems.map((item) => {
                    const active =
                        item.to === '/'
                            ? location.pathname === '/'
                            : location.pathname.startsWith(item.to);

                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className="no-underline flex flex-col items-center justify-center py-3 px-5 gap-0.5 relative transition-all duration-200"
                        >
                            <span
                                className="transition-all duration-200"
                                style={{ color: active ? '#2563eb' : '#94a3b8' }}
                            >
                                {item.icon}
                            </span>
                            <span
                                className="text-[0.6rem] font-bold transition-all duration-200"
                                style={{ color: active ? '#2563eb' : '#94a3b8' }}
                            >
                                {item.label}
                            </span>
                            {/* Cart badge */}
                            {item.badge !== undefined && item.badge > 0 && (
                                <span className="absolute top-2 right-3 w-4 h-4 bg-red-500 text-white text-[0.55rem] font-extrabold rounded-full flex items-center justify-center shadow">
                                    {item.badge > 99 ? '99+' : item.badge}
                                </span>
                            )}
                            {/* Active dot indicator */}
                            {active && (
                                <span className="absolute top-1.5 w-1 h-1 bg-blue-600 rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileBottomNav;
