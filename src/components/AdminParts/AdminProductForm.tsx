import React from 'react';

export type AdminNewProduct = {
    name: string;
    description: string;
    specifications: string;
    price: string;
    currency: string;
    categoryId: string;
    inStock: boolean;
    isNew: boolean;
    productScroll: boolean;
    hasPromotion: boolean;
    discount: string;
    sizes: string[];
};

export type AdminCategory = {
    id: string;
    name: string;
};

type Props = {
    newProduct: AdminNewProduct;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    imageFiles: File[];
    setImageFiles: React.Dispatch<React.SetStateAction<File[]>>;
    isSubmitting: boolean;
    onSubmit: (e: React.FormEvent) => void;
    categories: AdminCategory[];
    categoriesLoading: boolean;
    newCategoryName: string;
    setNewCategoryName: (value: string) => void;
    isCreatingCategory: boolean;
    onCreateCategory: () => void;
    onCancel?: () => void;
    onSizeChange: (size: string, checked: boolean) => void;
    isEditing?: boolean;
    existingImageUrls?: string[];
};

export default function AdminProductForm({
    newProduct,
    onChange,
    onSizeChange,
    imageFiles: _imageFiles,
    setImageFiles,
    isSubmitting,
    onSubmit,
    categories,
    categoriesLoading,
    newCategoryName,
    setNewCategoryName,
    isCreatingCategory,
    onCreateCategory,
    onCancel,
    isEditing,
    existingImageUrls,
}: Props) {
    return (
        <form onSubmit={onSubmit} className="bg-white border-t border-b border-gray-100 p-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-10">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                    {isEditing ? 'Update Product Details' : 'Initialize New Listing'}
                </h3>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:text-red-600 transition-colors"
                    >
                        [ Cancel ]
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-x-12 gap-y-10">

                {/* Left Column: Basic Info */}
                <div className="md:col-span-7 space-y-10">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Product Name</label>
                        <input
                            name="name"
                            value={newProduct.name}
                            onChange={onChange}
                            className="w-full h-14 border border-gray-300 px-4 text-xs font-bold outline-none focus:border-gray-900 transition"
                            placeholder="Enter product title..."

                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Description</label>
                        <textarea
                            name="description"
                            value={newProduct.description}
                            onChange={onChange}
                            rows={4}
                            className="w-full border border-gray-300 p-4 text-xs font-bold outline-none focus:border-gray-900 transition min-h-[120px]"
                            placeholder="Product storytelling..."
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Technical Specifications (One per line)</label>
                        <textarea
                            name="specifications"
                            value={newProduct.specifications}
                            onChange={onChange}
                            rows={6}
                            placeholder="Material: Surgical Steel\nFinish: 18k Gold Plating\nWeight: 14g"
                            className="w-full border border-gray-300 p-4 text-xs font-bold outline-none focus:border-gray-900 transition font-mono"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-gray-700 uppercase tracking-widest block">Available Sizes</label>
                        <div className="flex gap-8">
                            {['SMALL', 'MEDIUM', 'BIG'].map((size) => (
                                <label key={size} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 border flex items-center justify-center transition ${newProduct.sizes.includes(size) ? 'bg-gray-900 border-gray-900' : 'border-gray-300 group-hover:border-gray-900'}`}>
                                        <input
                                            type="checkbox"
                                            checked={newProduct.sizes.includes(size)}
                                            onChange={(e) => onSizeChange(size, e.target.checked)}
                                            className="hidden"
                                        />
                                        {newProduct.sizes.includes(size) && <div className="w-1.5 h-1.5 bg-white"></div>}
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{size}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Inventory & Pricing */}
                <div className="md:col-span-5 space-y-10">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Category</label>
                        <select
                            name="categoryId"
                            value={newProduct.categoryId}
                            onChange={onChange}
                            className="w-full h-14 border border-gray-300 px-4 text-xs font-bold outline-none focus:border-gray-900 bg-white"
                            required
                        >
                            {categoriesLoading ? (
                                <option value="">Loading...</option>
                            ) : (
                                categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)
                            )}
                        </select>
                        <div className="flex gap-2">
                            <input
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="New category..."
                                className="flex-1 h-10 border border-gray-300 px-3 text-[10px] font-bold outline-none focus:border-gray-900 transition"
                            />
                            <button
                                type="button"
                                onClick={onCreateCategory}
                                disabled={isCreatingCategory}
                                className="px-4 h-10 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition"
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Price (RWF)</label>
                        <div className="relative">
                            <input
                                name="price"
                                value={newProduct.price}
                                onChange={onChange}
                                inputMode="numeric"
                                className="w-full h-14 border border-gray-300 pl-12 pr-4 text-xs font-bold outline-none focus:border-gray-900 transition"
                                placeholder="0"
                                required
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-600 tracking-tighter">RWF</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-700 uppercase border-gray-900 tracking-widest">Promotion (%)</label>
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-6 border flex items-center px-1 cursor-pointer transition ${newProduct.hasPromotion ? 'bg-gray-900 border-gray-900' : 'bg-gray-100 border-gray-100'}`}
                                onClick={() => onChange({ target: { name: 'hasPromotion', value: !newProduct.hasPromotion, type: 'checkbox', checked: !newProduct.hasPromotion } } as any)}>
                                <div className={`w-4 h-4 bg-white shadow-sm transition-transform ${newProduct.hasPromotion ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                            <input
                                name="discount"
                                value={newProduct.discount}
                                onChange={onChange}
                                inputMode="numeric"
                                disabled={!newProduct.hasPromotion}
                                className="flex-1 h-12 border border-gray-300 px-4 text-xs font-bold outline-none focus:border-gray-900 disabled:bg-gray-50 transition"
                                placeholder="Disc. %"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Product Imagery</label>
                        <div className="group relative">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    setImageFiles((prev) => [...prev, ...files]);
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                required={!isEditing && _imageFiles.length === 0}
                            />
                            <div className="w-full h-32 border border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 group-hover:border-gray-900 transition duration-300">
                                <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Browse Assets</span>
                                <span className="text-[8px] text-gray-600 font-medium uppercase tracking-tighter">Drag and drop or click to upload</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-4">
                            {isEditing && existingImageUrls?.map((url, idx) => (
                                <div key={`ex-${idx}`} className="w-16 h-16 border border-gray-100 p-1 relative group">
                                    <img src={url} className="w-full h-full object-contain mix-blend-multiply" alt="" />
                                    <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                        <span className="text-[8px] font-bold text-gray-900 uppercase tracking-tighter">Existing</span>
                                    </div>
                                </div>
                            ))}
                            {_imageFiles.map((file, idx) => (
                                <div key={`new-${idx}`} className="w-16 h-16 border border-gray-900 p-1 relative group">
                                    <img src={URL.createObjectURL(file)} className="w-full h-full object-contain mix-blend-multiply" alt="" />
                                    <button
                                        type="button"
                                        onClick={() => setImageFiles((prev) => prev.filter((_, i) => i !== idx))}
                                        className="absolute -top-1 -right-1 w-4 h-4 bg-gray-900 text-white text-[10px] flex items-center justify-center"
                                    >×</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6 space-y-4 border-t border-gray-100">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 border flex items-center justify-center transition ${newProduct.inStock ? 'bg-gray-900 border-gray-900' : 'border-gray-200 group-hover:border-gray-900'}`}>
                                <input type="checkbox" name="inStock" checked={newProduct.inStock} onChange={onChange} className="hidden" />
                                {newProduct.inStock && <div className="w-1.5 h-1.5 bg-white"></div>}
                            </div>
                            <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Active Stock Status</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 border flex items-center justify-center transition ${newProduct.isNew ? 'bg-gray-900 border-gray-900' : 'border-gray-200 group-hover:border-gray-900'}`}>
                                <input type="checkbox" name="isNew" checked={newProduct.isNew} onChange={onChange} className="hidden" />
                                {newProduct.isNew && <div className="w-1.5 h-1.5 bg-white"></div>}
                            </div>
                            <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Mark as New Arrival</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 border flex items-center justify-center transition ${newProduct.productScroll ? 'bg-gray-900 border-gray-900' : 'border-gray-200 group-hover:border-gray-900'}`}>
                                <input type="checkbox" name="productScroll" checked={newProduct.productScroll} onChange={onChange} className="hidden" />
                                {newProduct.productScroll && <div className="w-1.5 h-1.5 bg-white"></div>}
                            </div>
                            <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Enable Product Scroll</span>
                        </label>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="mt-16 w-full md:w-auto px-12 h-16 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
            >
                {isSubmitting ? 'Synchronizing...' : (isEditing ? 'Confirm Update' : 'Publish Listing')}
            </button>
        </form>
    );
}
