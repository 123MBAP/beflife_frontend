import React from 'react';
import { Link } from 'react-router-dom';

type PromoBannerProps = {
    title: string;
    subtitle?: string;
    ctaText?: string;
    ctaHref?: string;
    /** 'blue' | 'gold' | 'dark' */
    variant?: 'blue' | 'gold' | 'dark';
    badgeText?: string;
};

const gradients: Record<string, string> = {
    blue: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
    gold: 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%)',
    dark: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
};

const PromoBanner: React.FC<PromoBannerProps> = ({
    title,
    subtitle,
    ctaText = 'Shop Now',
    ctaHref = '/products',
    variant = 'blue',
    badgeText,
}) => {
    const bg = gradients[variant] ?? gradients.blue;
    const ctaClass =
        variant === 'gold'
            ? 'bg-white text-amber-600 hover:bg-amber-50'
            : 'bg-white text-blue-700 hover:bg-blue-50';

    return (
        <div
            className="relative w-full rounded-2xl overflow-hidden my-8 md:my-10"
            style={{ background: bg, minHeight: '120px' }}
        >
            {/* Decorative circles */}
            <span className="absolute w-48 h-48 rounded-full border-[3px] border-white/10 -top-14 -left-14 pointer-events-none" />
            <span className="absolute w-32 h-32 rounded-full border-[3px] border-white/10 -bottom-10 -right-10 pointer-events-none" />
            <span className="absolute w-20 h-20 rounded-full bg-white/5 top-3 right-32 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 px-6 md:px-10 py-7">
                <div>
                    {badgeText && (
                        <span className="inline-block bg-white/20 text-white text-[0.6rem] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-widest mb-2">
                            {badgeText}
                        </span>
                    )}
                    <h3 className="text-xl md:text-2xl font-extrabold text-white leading-tight m-0">{title}</h3>
                    {subtitle && (
                        <p className="text-white/80 text-sm mt-1 font-medium">{subtitle}</p>
                    )}
                </div>
                <Link
                    to={ctaHref}
                    className={`flex-shrink-0 no-underline font-extrabold text-sm px-6 py-2.5 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95 ${ctaClass}`}
                >
                    {ctaText}
                </Link>
            </div>
        </div>
    );
};

export default PromoBanner;
