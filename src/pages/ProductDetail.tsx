import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheck, FaChevronRight, FaPlus, FaMinus, FaWhatsapp } from 'react-icons/fa';
import { FiShoppingCart, FiShare2 } from 'react-icons/fi';
import { useCart } from '../contexts/CartContext';
import { toast } from 'react-toastify';
import HorizontalScrollRow from '../components/HorizontalScrollRow';
import ProductCard, { ProductCardData } from '../components/ProductCard';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const apiBaseUrl = (process.env.REACT_APP_API_URL ?? '').replace(/\/$/, '');

    const [product, setProduct] = useState<any>(null);
    const [relatedProducts, setRelatedProducts] = useState<ProductCardData[]>([]);
    const [selectedSize, setSelectedSize] = useState('Standard');
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [activeImagePath, setActiveImagePath] = useState('');
    const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                if (!apiBaseUrl || !id) {
                    setProduct(null);
                    setLoading(false);
                    return;
                }

                const res = await fetch(`${apiBaseUrl}/api/products/${id}`);
                const data = await res.json().catch(() => ({}));
                if (res.ok && data?.ok && data?.product) {
                    const p = data.product;
                    const imagesArr = (Array.isArray(p.imageUrls) && p.imageUrls.length > 0)
                        ? p.imageUrls
                        : [p.imageUrl || p.image_url || '/ring.png'];

                    const mapped = {
                        id: p.id,
                        name: p.name,
                        description: p.description,
                        longDescription: p.description,
                        basePrice: p.price,
                        currency: p.currency,
                        sizes: Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ['Standard'],
                        images: imagesArr,
                        stock: p.inStock ? 999 : 0,
                        category: p.category || 'General',
                        features: Array.isArray(p.features) ? p.features : [],
                        specifications: p.specifications || {},
                        rating: 4.8,
                        reviewCount: Math.floor(Math.random() * 50) + 10,
                    };

                    setProduct(mapped);
                    setActiveImagePath(mapped.images[0]);
                    setSelectedSize(mapped.sizes[0]);

                    // Fetch related products (normalised for <ProductCard />)
                    const relatedCategory = encodeURIComponent(String(p.category ?? ''));
                    const relatedRes = await fetch(`${apiBaseUrl}/api/products?category=${relatedCategory}`);
                    const relatedData = await relatedRes.json().catch(() => ({}));
                    if (relatedRes.ok && Array.isArray(relatedData?.products)) {
                        const cards: ProductCardData[] = relatedData.products
                            .filter((item: any) => item.id !== p.id)
                            .slice(0, 8)
                            .map((item: any) => {
                                const discount = item.discount || null;
                                const price = Number(item.price ?? 0);
                                const oldPrice = discount ? Number((price / (1 - discount / 100)).toFixed(2)) : null;
                                const image = (Array.isArray(item.imageUrls) && item.imageUrls.length > 0)
                                    ? item.imageUrls[0]
                                    : (item.imageUrl || item.image_url || item.image || '/ring.png');

                                return {
                                    id: item.id,
                                    name: item.name,
                                    category: item.category || 'General',
                                    price,
                                    oldPrice,
                                    currency: item.currency || 'RWF',
                                    image,
                                    discount,
                                    isNew: Boolean(item.isNew),
                                    inStock: item.inStock,
                                };
                            });

                        setRelatedProducts(cards);
                    }
                } else {
                    setProduct(null);
                }
            } catch (err) {
                console.error("Failed to fetch product:", err);
                setProduct(null);
            } finally {
                setLoading(false);
            }
        };

        load();
        window.scrollTo(0, 0);
    }, [id, apiBaseUrl]);

    const handleAddToCart = () => {
        if (!selectedSize) {
            toast.error('Please select a size or variant');
            return;
        }

        const cartItem = {
            id: product.id,
            name: product.name,
            price: product.basePrice,
            currency: product.currency,
            size: selectedSize,
            quantity: quantity,
            image: product.images[0]
        };

        addToCart(cartItem);
        toast.success(`${product.name} added to cart!`, {
            position: "bottom-center",
            autoClose: 2000,
            theme: "colored"
        });
    };

    const handleBuyNow = () => {
        const productInfo = `${product.name} - ${formatPrice(product.basePrice)}`;
        const whatsappUrl = `https://wa.me/250795888552?text=Hi%2C%20I%20would%20like%20to%20purchase%3A%20${encodeURIComponent(productInfo)}%0ASize%3A%20${selectedSize}%0AQuantity%3A%20${quantity}`;
        window.open(whatsappUrl, '_blank');
    };

    const formatPrice = (price: number) => {
        return `${price.toLocaleString()} RWF`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 uppercase tracking-widest text-[10px] font-bold text-gray-400 animate-pulse">
                Loading product experience...
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
                <div className="text-center bg-white p-12 border border-gray-100 shadow-sm max-w-sm w-full">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Product Not Found</h2>
                    <p className="text-gray-500 text-sm mb-8">The item you are looking for might have been moved or is no longer available.</p>
                    <button
                        onClick={() => navigate('/products')}
                        className="w-full bg-blue-600 text-white font-bold py-4 text-xs uppercase tracking-widest hover:bg-blue-700 transition"
                    >
                        Back to Catalog
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen pb-24 lg:pb-12">
            <div className="max-w-7xl mx-auto">

                {/* Mobile Breadcrumb - Simplified */}
                <div className="lg:hidden px-4 py-4 border-b border-gray-50 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span onClick={() => navigate('/')}>Home</span>
                    <FaChevronRight size={8} />
                    <span onClick={() => navigate('/products')}>Catalog</span>
                    <FaChevronRight size={8} />
                    <span className="text-blue-600 truncate">{product.category}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12">

                    {/* Media Gallery */}
                    <div className="lg:col-span-7 p-4 lg:p-8 lg:border-r border-gray-100">
                        <div className="sticky top-24">
                            <div className="aspect-square bg-gray-50 flex items-center justify-center p-8 relative overflow-hidden group">
                                <img
                                    src={activeImagePath}
                                    alt={product.name}
                                    className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute bottom-4 right-4 flex gap-2">
                                    <button className="w-10 h-10 bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-blue-600 transition border border-gray-100">
                                        <FiShare2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Thumbnails */}
                            <div className="flex gap-4 mt-6 overflow-x-auto pb-2 scrollbar-hide">
                                {product.images.map((img: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImagePath(img)}
                                        className={`flex-shrink-0 w-20 h-20 bg-gray-50 border transition placeholder-gray-200 ${activeImagePath === img ? 'border-blue-600' : 'border-transparent hover:border-gray-200'}`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Product Details Side */}
                    <div className="lg:col-span-5 p-6 lg:p-12">
                        <div className="lg:sticky lg:top-24">
                            {/* Desktop Category */}
                            <div className="hidden lg:block mb-8 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <span className="hover:text-blue-600 transition cursor-pointer" onClick={() => navigate('/')}>Home</span>
                                <FaChevronRight size={8} />
                                <span className="hover:text-blue-600 transition cursor-pointer" onClick={() => navigate('/products')}>Catalog</span>
                                <FaChevronRight size={8} />
                                <span className="text-blue-600">{product.category}</span>
                            </div>

                            <div className="mb-8">
                                <h1 className="text-2xl lg:text-2xl font-bold text-gray-900 mb-2 leading-tight">
                                    {product.name}
                                </h1>
                                {/* <div className="flex items-center gap-4">
                                    <div className="flex items-center text-orange-400 gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <FaStar key={i} size={14} className={i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-200'} />
                                        ))}
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{product.rating} / 5.0 ({product.reviewCount} Reviews)</span>
                                </div> */}
                            </div>

                            <div className="flex items-baseline gap-4 mb-10">
                                <span className="text-2xl font-bold text-gray-900">{formatPrice(product.basePrice)}</span>
                                {product.oldPrice && (
                                    <span className="text-lg text-gray-400 line-through">{formatPrice(product.oldPrice)}</span>
                                )}
                            </div>

                            {/* Options */}
                            <div className="space-y-10 mb-12">
                                {/* Size */}
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[11px] font-bold text-gray-900 uppercase tracking-widest">Select Size</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {product.sizes.map((size: string) => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`min-w-[70px] h-12 flex items-center justify-center px-4 text-xs font-bold transition border ${selectedSize === size
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quantity Selector */}
                                <div>
                                    <span className="text-[11px] font-bold text-gray-900 uppercase tracking-widest block mb-4">Quantity</span>
                                    <div className="inline-flex items-center border border-gray-100 px-2 h-12">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-10 h-full flex items-center justify-center text-gray-400 hover:text-gray-900"
                                        >
                                            <FaMinus size={10} />
                                        </button>
                                        <span className="w-12 text-center text-sm font-bold text-gray-900">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="w-10 h-full flex items-center justify-center text-gray-400 hover:text-gray-900"
                                        >
                                            <FaPlus size={10} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop CTAs */}
                            <div className="hidden lg:grid grid-cols-2 gap-4">
                                <button
                                    onClick={handleAddToCart}
                                    className="bg-blue-600 text-white font-bold py-5 text-xs uppercase tracking-widest hover:bg-blue-700 transition flex items-center justify-center gap-3"
                                >
                                    <FiShoppingCart size={16} /> Add to Bag
                                </button>
                                <button
                                    onClick={handleBuyNow}
                                    className="bg-orange-500 text-white font-bold py-5 text-xs uppercase tracking-widest hover:bg-orange-600 transition flex items-center justify-center gap-3"
                                >
                                    <FaWhatsapp size={16} /> WhatsApp Buy
                                </button>
                            </div>

                            {/* <div className="mt-8 space-y-4">
                                <div className="flex items-center gap-3 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    Free Delivery to Kigali & Rwanda
                                </div>
                                <div className="flex items-center gap-3 text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                    2-Year International Warranty
                                </div>
                            </div> */}
                        </div>
                    </div>
                </div>

                {/* Information Tabs Section */}
                <div className="px-6 lg:px-12 py-16 border-t border-gray-100">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                        <div className="lg:col-span-12">
                            <div className="flex border-b border-gray-100 gap-12 mb-12 overflow-x-auto scrollbar-hide">
                                <button
                                    onClick={() => setActiveTab('description')}
                                    className={`pb-4 border-b-2 text-[11px] font-bold uppercase tracking-widest flex-shrink-0 ${activeTab === 'description'
                                        ? 'border-blue-600 text-gray-900'
                                        : 'border-transparent text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    Description
                                </button>
                                <button
                                    onClick={() => setActiveTab('specifications')}
                                    className={`pb-4 border-b-2 text-[11px] font-bold uppercase tracking-widest flex-shrink-0 ${activeTab === 'specifications'
                                        ? 'border-blue-600 text-gray-900'
                                        : 'border-transparent text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    Specifications
                                </button>
                                {/* <button
                                    onClick={() => setActiveTab('reviews')}
                                    className={`pb-4 border-b-2 text-[11px] font-bold uppercase tracking-widest flex-shrink-0 ${activeTab === 'reviews'
                                            ? 'border-blue-600 text-gray-900'
                                            : 'border-transparent text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    Reviews
                                </button> */}
                            </div>

                            {activeTab === 'description' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">The Detail</h3>
                                        <div className="text-gray-500 text-sm leading-relaxed space-y-4">
                                            {String(product.longDescription ?? '')
                                                .split('\\n')
                                                .map((p: string, i: number) => (
                                                    <p key={i}>{p}</p>
                                                ))}
                                        </div>

                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">The Features</h3>
                                        <ul className="space-y-4">
                                            {product.features.map((feat: string, idx: number) => (
                                                <li
                                                    key={idx}
                                                    className="flex items-start gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest"
                                                >
                                                    <FaCheck size={10} className="text-blue-600 mt-1" />
                                                    <span>{feat}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'specifications' && (
                                <div className="bg-gray-50 border border-gray-100 px-6 py-8">
                                    {Array.isArray(product.features) && product.features.length > 0 ? (
                                        <ul className="space-y-4">
                                            {product.features.map((feat: string, idx: number) => (
                                                <li
                                                    key={idx}
                                                    className="flex items-start gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest"
                                                >
                                                    <FaCheck size={10} className="text-blue-600 mt-1" />
                                                    <span>{feat}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            No specifications available.
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div className="bg-gray-50 border border-gray-100 px-6 py-8 text-center">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Reviews coming soon.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <section className="px-6 lg:px-12 py-20 bg-gray-50">
                        <div className="flex justify-between items-end mb-12">
                            <div>
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-1">More from {product.category}</span>
                                <h2 className="text-2xl font-bold text-gray-900">Recommended For You</h2>
                            </div>
                            <button
                                onClick={() => navigate('/products')}
                                className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-blue-600 transition"
                            >
                                View All
                            </button>
                        </div>

                        <HorizontalScrollRow gap={1} showArrows>
                            {relatedProducts.map((p) => (
                                <ProductCard key={p.id} product={p} variant="compact" />
                            ))}
                        </HorizontalScrollRow>
                    </section>
                )}

            </div>

            {/* Mobile Sticky CTA */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 grid grid-cols-2 gap-3 z-50">
                <button
                    onClick={handleAddToCart}
                    className="bg-gray-900 text-white font-bold py-4 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                >
                    <FiShoppingCart size={14} /> Bag
                </button>
                <button
                    onClick={handleBuyNow}
                    className="bg-orange-500 text-white font-bold py-4 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                >
                    <FaWhatsapp size={14} /> Buy Now
                </button>
            </div>
        </div>
    );
};

export default ProductDetail;