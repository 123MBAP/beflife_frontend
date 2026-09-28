import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShoppingCart } from 'react-icons/fi';
import { CartContext } from '../contexts/CartContext';
import { toast } from 'react-toastify';

export type ProductCardData = {
    id: string;
    name: string;
    category: string;
    price: number;
    oldPrice?: number | null;
    currency: string;
    image: string;
    discount?: number | null;
    isNew?: boolean;
    inStock?: boolean;
};

type ProductCardProps = {
    product: ProductCardData;
    /** 'default' = standard grid card | 'compact' = narrow for horizontal scroll rows */
    variant?: 'default' | 'compact';
    /** When true the card fills 2 columns (featured layout) */
    featured?: boolean;
};

const ProductCard: React.FC<ProductCardProps> = ({ product, variant = 'default', featured = false }) => {
    const { addToCart } = useContext(CartContext);
    const navigate = useNavigate();
    const [pressing, setPressing] = useState(false);

    const inStock = product.inStock !== false;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!inStock) return;
        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            currency: product.currency,
            size: 'Standard',
            sizeLabel: 'Standard',
            image: product.image,
            quantity: 1,
        });
        toast.success(`${product.name} added to cart!`, {
            position: 'top-right',
            autoClose: 2000,
            hideProgressBar: true,
            theme: 'colored',
        });
    };

    const formatPrice = (p: number) => {
        return `RWF ${Math.round(p).toLocaleString()}`;
    };

    /* ─────────────────────────────────────────────
       COMPACT: horizontal scroll rows
    ───────────────────────────────────────────── */
    if (variant === 'compact') {
        return (
            <div
                className="group flex-shrink-0 bg-white cursor-pointer transition-all duration-150"
                style={{
                    width: '170px',
                    border: '1px solid #e5e7eb',
                    transform: pressing ? 'scale(0.98)' : 'scale(1)',
                }}
                onMouseDown={() => setPressing(true)}
                onMouseUp={() => setPressing(false)}
                onTouchStart={() => setPressing(true)}
                onTouchEnd={() => setPressing(false)}
                onClick={() => navigate(`/product/${product.id}`)}
            >
                {/* Category + title (above image) */}
                <div className="px-3 pt-3 pb-2">
                    <p className="text-[0.6rem] text-gray-400 font-medium leading-snug mb-1 truncate">
                        {product.category}
                    </p>
                    <p className="text-xs font-bold text-blue-700 leading-snug line-clamp-2" style={{ minHeight: '2.2rem' }}>
                        {product.name}
                    </p>
                </div>

                {/* Image */}
                <div
                    className="relative bg-white flex items-center justify-center overflow-hidden"
                    style={{ height: '65px', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6' }}
                >
                    <img
                        src={product.image}
                        alt={product.name}
                        className="max-w-full max-h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/ring.png'; }}
                    />
                    {product.discount && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-[0.55rem] font-bold px-1.5 py-0.5 rounded">
                            -{product.discount}%
                        </span>
                    )}
                    {!inStock && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                            <span className="bg-gray-700 text-white text-[0.55rem] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Sold Out</span>
                        </div>
                    )}
                </div>

                {/* Price + cart */}
                <div className="flex items-center justify-between px-3 py-2.5">
                    <div>
                        <span className="text-sm font-extrabold text-slate-800">{formatPrice(product.price)}</span>
                        {product.oldPrice && (
                            <span className="text-[0.6rem] text-gray-400 line-through ml-1">{formatPrice(product.oldPrice)}</span>
                        )}
                    </div>
                    <button
                        onClick={handleAddToCart}
                        disabled={!inStock}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-all duration-150 cursor-pointer border-none shadow-sm flex-shrink-0 disabled:opacity-50"
                        style={{ background: inStock ? '#f97316' : '#d1d5db' }}
                    >
                        <FiShoppingCart size={13} />
                    </button>
                </div>
            </div>
        );
    }

    /* ─────────────────────────────────────────────
       DEFAULT / FEATURED: grid cards
    ───────────────────────────────────────────── */
    return (
        <div
            className="group bg-white cursor-pointer transition-all duration-200 relative overflow-hidden"
            style={{
                gridColumn: featured ? 'span 2' : 'span 1',
                transform: pressing ? 'scale(0.99)' : 'scale(1)',
                zIndex: pressing ? 10 : 1,
            }}
            onMouseDown={() => setPressing(true)}
            onMouseUp={() => setPressing(false)}
            onTouchStart={() => setPressing(true)}
            onTouchEnd={() => setPressing(false)}
            onClick={() => navigate(`/product/${product.id}`)}
        >
            {/* Category + title above the image */}
            <div className="px-3 pt-3 pb-2">
                <p className="text-[0.6rem] text-gray-400 font-medium leading-snug mb-1 truncate">
                    {product.category}
                </p>
                <h3
                    className="text-xs md:text-sm font-bold text-blue-700 leading-snug line-clamp-2 group-hover:text-blue-800 transition-colors duration-150"
                    style={{ minHeight: '2.4rem' }}
                >
                    {product.name}
                </h3>
            </div>

            {/* Product image — white bg, object-contain */}
            <div
                className="relative bg-white flex items-center justify-center overflow-hidden"
                style={{
                    height: featured ? '240px' : '180px',
                }}
            >
                <img
                    src={product.image}
                    alt={product.name}
                    className="max-w-[90%] max-h-[90%] object-contain transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/ring.png'; }}
                />

                {/* Discount badge */}
                {product.discount && (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[0.55rem] font-bold px-1.5 py-0.5 rounded shadow-sm z-10">
                        -{product.discount}%
                    </span>
                )}
                {product.isNew && !product.discount && (
                    <span className="absolute top-2 left-2 bg-amber-400 text-white text-[0.55rem] font-bold px-1.5 py-0.5 rounded shadow-sm z-10">
                        NEW
                    </span>
                )}

                {/* Out of stock overlay */}
                {!inStock && (
                    <div className="absolute inset-0 bg-white/75 flex items-center justify-center z-20">
                        <span className="bg-gray-700 text-white text-[0.6rem] font-bold px-2 py-0.5 rounded uppercase tracking-widest shadow">
                            Out of Stock
                        </span>
                    </div>
                )}
            </div>

            {/* Price row + orange cart button */}
            <div className="flex items-center justify-between px-3 py-3 mt-auto">
                <div className="flex flex-col">
                    <span className="text-base font-extrabold text-slate-800 leading-none">{formatPrice(product.price)}</span>
                    {product.oldPrice && (
                        <span className="text-[0.65rem] text-gray-400 line-through font-medium mt-1">{formatPrice(product.oldPrice)}</span>
                    )}
                </div>
                <button
                    onClick={handleAddToCart}
                    disabled={!inStock}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer border-none shadow-sm flex-shrink-0 disabled:opacity-50"
                    style={{ background: inStock ? '#f97316' : '#94a3b8' }}
                    title="Add to cart"
                >
                    <FiShoppingCart size={15} />
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
