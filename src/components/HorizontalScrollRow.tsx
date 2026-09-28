import React, { useRef, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

type HorizontalScrollRowProps = {
    children: React.ReactNode;
    /** Gap between items in px, default 12 */
    gap?: number;
    /** Show left/right arrow navigation buttons on desktop */
    showArrows?: boolean;
    /** Extra class for the outer container */
    className?: string;
};

/**
 * A horizontal scrolling row with:
 * - CSS scroll-snap (mandatory, x-axis)
 * - Hidden scrollbar
 * - Optional desktop arrow navigation
 * - Smooth inertia scrolling
 */
const HorizontalScrollRow: React.FC<HorizontalScrollRowProps> = ({
    children,
    gap = 12,
    showArrows = true,
    className = '',
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const scrollAmount = scrollRef.current.offsetWidth * 0.75;
        scrollRef.current.scrollBy({
            left: direction === 'right' ? scrollAmount : -scrollAmount,
            behavior: 'smooth',
        });
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (scrollRef.current) {
                const el = scrollRef.current;
                // If we've reached the end of the scroll, go back to the start
                if (Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth) {
                    el.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    const scrollAmount = el.offsetWidth * 0.75;
                    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                }
            }
        }, 3500); // Auto scroll every 3.5 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`relative group/row ${className}`}>
            {/* Left arrow */}
            {showArrows && (
                <button
                    onClick={() => scroll('left')}
                    aria-label="Scroll left"
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:shadow-xl transition-all duration-200 opacity-0 group-hover/row:opacity-100 cursor-pointer hidden md:flex"
                >
                    <FaChevronLeft size={13} />
                </button>
            )}

            {/* Scroll container */}
            <div
                ref={scrollRef}
                className="flex overflow-x-auto pb-1"
                style={{
                    gap: `${gap}px`,
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
            >
                {/* Hide webkit scrollbar via inline style because Tailwind plugin may not be available */}
                <style>{`.hsr-inner::-webkit-scrollbar { display: none; }`}</style>
                {React.Children.map(children, (child) => (
                    <div style={{ scrollSnapAlign: 'start', flexShrink: 0 }}>
                        {child}
                    </div>
                ))}
            </div>

            {/* Right arrow */}
            {showArrows && (
                <button
                    onClick={() => scroll('right')}
                    aria-label="Scroll right"
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:shadow-xl transition-all duration-200 opacity-0 group-hover/row:opacity-100 cursor-pointer hidden md:flex"
                >
                    <FaChevronRight size={13} />
                </button>
            )}
        </div>
    );
};

export default HorizontalScrollRow;
