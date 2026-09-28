import React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';

export type AdminProduct = {
    id: string;
    name: string;
    description: string;
    category: string;
    categoryId?: string;
    inStock: boolean;
    isNew: boolean;
    productScroll?: boolean;
    price: number;
    currency: string;
    discount?: number;
    features?: string[];
    sizes: string[];
    imageUrls: string[];
    imagePublicIds: string[];
};

type Props = {
    productsLoading: boolean;
    products: AdminProduct[];
    onEdit: (product: AdminProduct) => void;
    onDelete: (productId: string) => void;
};

export default function AdminProductsGrid({ productsLoading, products, onEdit, onDelete }: Props) {
    if (productsLoading) {
        return <div className="text-center py-20 text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">Synchronizing Listings...</div>;
    }

    if (products.length === 0) {
        return (
            <div className="text-center py-20 border border-dashed border-gray-200">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No Active Inventory</span>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 border border-gray-200">
            {products.map((product) => (
                <div
                    key={product.id}
                    className="bg-white flex flex-col group transition-all duration-500"
                >
                    <div className="aspect-[4/3] overflow-hidden bg-white p-8 relative">
                        <img
                            src={(product.imageUrls && product.imageUrls.length > 0) ? product.imageUrls[0] : '/ring.png'}
                            alt={product.name}
                            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700"
                        />
                        {product.discount && product.discount > 0 && (
                            <div className="absolute top-4 left-4 bg-gray-900 text-white text-[8px] font-bold px-2 py-1 uppercase tracking-tighter">
                                -{product.discount}%
                            </div>
                        )}
                        {!product.inStock && (
                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[2px]">
                                <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest border border-gray-900 px-4 py-2">Out of Stock</span>
                            </div>
                        )}
                    </div>

                    <div className="p-6 flex flex-col flex-1 border-t border-gray-100">
                        <div className="flex justify-between items-start gap-4 mb-4">
                            <div>
                                <h3 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest leading-relaxed mb-1">{product.name}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{product.category}</span>
                                    <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${product.inStock ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {product.inStock ? 'Active' : 'Archived'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto flex items-end justify-between">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter mb-0.5">Asset Valuation</span>
                                <span className="text-sm font-bold text-gray-900 tracking-tighter">
                                    {product.price.toLocaleString()} <span className="text-[10px] font-medium text-gray-400">RWF</span>
                                </span>
                            </div>

                            <div className="flex gap-1">
                                <button
                                    onClick={() => onEdit(product)}
                                    className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-900 hover:text-white transition-colors duration-300 rounded-sm"
                                    title="Edit Product"
                                >
                                    <FaEdit size={12} />
                                </button>
                                <button
                                    onClick={() => onDelete(product.id)}
                                    className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-red-600 hover:text-white transition-colors duration-300 rounded-sm"
                                    title="Remove Product"
                                >
                                    <FaTrash size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
