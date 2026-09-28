import React from 'react';
import { Link } from 'react-router-dom';

type SectionHeaderProps = {
    tag?: string;
    title: string;
    seeAllHref?: string;
    /** Extra class overrides for the wrapper */
    className?: string;
};

/**
 * Consistent section header: coloured pill tag + title on left, "See All" link on right.
 */
const SectionHeader: React.FC<SectionHeaderProps> = ({ tag, title, seeAllHref, className = '' }) => {
    return (
        <div className={`flex items-center justify-between mb-5 ${className}`}>
            <div className="flex items-center gap-3">
                {tag && (
                    <span className="bg-blue-50 text-blue-600 text-[0.6rem] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest">
                        {tag}
                    </span>
                )}
                <h2 className="text-lg md:text-xl font-extrabold text-slate-900 m-0 tracking-tight">
                    {title}
                </h2>
            </div>
            {seeAllHref && (
                <Link
                    to={seeAllHref}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition no-underline flex items-center gap-1 flex-shrink-0"
                >
                    See all
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </Link>
            )}
        </div>
    );
};

export default SectionHeader;
