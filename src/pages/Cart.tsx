import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaMinus, FaPlus, FaShoppingBag, FaCheckCircle, FaArrowRight } from 'react-icons/fa';
import { useCart } from '../contexts/CartContext';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Cart = () => {
    const {
        cartItems,
        removeFromCart,
        updateQuantity,
        clearCart,
    } = useCart();
    const { token } = useAuth();
    const navigate = useNavigate();
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);

    const apiBaseUrl = useMemo(() => (process.env.REACT_APP_API_URL ?? '').replace(/\/$/, ''), []);

    const formatPrice = (price: number) => {
        const formatted = new Intl.NumberFormat('en-RW', {
            maximumFractionDigits: 0,
        }).format(price);
        return `${formatted} RWF`;
    };

    const handleQuantityChange = (item: any, newQuantity: number) => {
        if (newQuantity <= 0) {
            handleRemoveItem(item);
            return;
        }
        updateQuantity(item.id, item.size, newQuantity);
    };

    const handleRemoveItem = (item: any) => {
        removeFromCart(item.id, item.size);
        toast.info(`${item.name} removed from bag`, {
            position: "bottom-center",
            autoClose: 2000
        });
    };

    const handleClearCart = () => {
        if (window.confirm('Clear all items from your bag?')) {
            clearCart();
            toast.success('Bag cleared');
        }
    };

    const cartTotalRwf = cartItems.reduce((acc, item: any) => acc + (item.price * item.quantity), 0);
    const shippingThreshold = 1_000_000;

    const buildTotalsByCurrency = (items: any[]) => {
        return items.reduce<Record<string, number>>((acc, item) => {
            const currency = 'RWF';
            acc[currency] = (acc[currency] || 0) + (item.price * item.quantity);
            return acc;
        }, {});
    };

    const buildWhatsAppMessage = (orderId: string) => {
        const itemsText = cartItems
            .map((item: any) => `${item.quantity}x ${item.name} (Size ${item.size})`)
            .join(', ');

        const totalsByCurrency = buildTotalsByCurrency(cartItems);
        const totalsText = Object.entries(totalsByCurrency)
            .map(([, total]) => formatPrice(total))
            .join(' | ');

        return `Hi, I would like to complete my purchase. Order ID: ${orderId}. Bag: ${itemsText}. Totals: ${totalsText}`;
    };

    const handleContinueToWhatsApp = async () => {
        if (!apiBaseUrl) {
            toast.error('API configuration missing');
            return;
        }
        if (!token) {
            toast.error('Please login before checking out');
            return;
        }
        if (cartItems.length === 0) return;

        setIsCreatingOrder(true);
        try {
            const items = cartItems.map((item: any) => ({
                productId: String(item.id),
                name: String(item.name),
                size: String(item.size || 'Standard'),
                quantity: Number(item.quantity || 1),
                price: Number(item.price || 0),
                currency: 'RWF',
            }));

            const totalsByCurrency = buildTotalsByCurrency(cartItems);

            const res = await fetch(`${apiBaseUrl}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ items, totalsByCurrency }),
            });

            const data: any = await res.json().catch(() => ({}));
            if (!res.ok || !data?.ok) throw new Error(data?.error || 'Order creation failed');

            const orderId = data?.order?.id;
            const message = buildWhatsAppMessage(orderId);
            const whatsappUrl = `https://wa.me/250795888552?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
            toast.success('Order saved. Opening WhatsApp...');
        } catch (err: any) {
            toast.error(err?.message || 'Cart operation failed');
        } finally {
            setIsCreatingOrder(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 bg-gray-50/50">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-24 h-24 bg-white border border-gray-100 shadow-sm flex items-center justify-center mx-auto">
                        <FaShoppingBag className="text-gray-200 text-4xl" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2 uppercase tracking-widest">Your Bag is Empty</h2>
                        <p className="text-gray-500 text-sm">Refresh your style. Check out our latest arrivals and find something special.</p>
                    </div>
                    <Link to="/products" className="block w-full bg-blue-600 text-white font-bold py-5 text-xs uppercase tracking-widest hover:bg-blue-700 transition">
                        Shop Arrivals
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen">
            {/* Shipping Progress Bar */}

            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
                <div className="flex justify-between items-end mb-10 pb-4 border-b border-gray-100">
                    <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-widest">Your Bag <span className="text-gray-400">({cartItems.length})</span></h1>
                    <button onClick={handleClearCart} className="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest transition">Clear Bag</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Item List */}
                    <div className="lg:col-span-8">
                        <div className="bg-gray-200 gap-px border border-gray-200 overflow-hidden shadow-sm">
                            {cartItems.map((item: any) => (
                                <div key={`${item.id}-${item.size}`} className="bg-white p-6 flex gap-6">
                                    <div className="w-24 h-24 lg:w-32 lg:h-32 bg-gray-50 flex items-center justify-center p-4 border border-gray-100 flex-shrink-0 group cursor-pointer" onClick={() => navigate(`/products/${item.id}`)}>
                                        <img src={item.image || '/ring.png'} alt={item.name} className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-110" />
                                    </div>

                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight hover:text-blue-600 transition cursor-pointer" onClick={() => navigate(`/products/${item.id}`)}>
                                                    {item.name}
                                                </h3>
                                                <button onClick={() => handleRemoveItem(item)} className="text-gray-400 hover:text-gray-900 transition p-1">
                                                    <FaTrash size={12} />
                                                </button>
                                            </div>
                                            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                <span>Size: <span className="text-gray-900">{item.size}</span></span>
                                                <span className="text-green-600">In Stock</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end mt-4">
                                            {/* Quantity */}
                                            <div className="inline-flex items-center border border-gray-100 h-10 px-1">
                                                <button onClick={() => handleQuantityChange(item, item.quantity - 1)} className="w-8 flex items-center justify-center text-gray-400 hover:text-gray-900"><FaMinus size={8} /></button>
                                                <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                                                <button onClick={() => handleQuantityChange(item, item.quantity + 1)} className="w-8 flex items-center justify-center text-gray-400 hover:text-gray-900"><FaPlus size={8} /></button>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-xs text-gray-400 font-bold mb-1">{formatPrice(item.price)} each</div>
                                                <div className="text-sm font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="lg:sticky lg:top-36 space-y-6">
                            <div className="border border-gray-100 p-8 shadow-sm space-y-8">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest pb-4 border-b border-gray-100">Order Summary</h3>

                                <div className="space-y-4">
                                    {Object.entries(buildTotalsByCurrency(cartItems)).map(([currency, total]) => (
                                        <div key={currency} className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                            <span className="text-gray-400">Subtotal ({currency})</span>
                                            <span className="text-gray-900">{formatPrice(total)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                        <span className="text-gray-400">Shipping</span>
                                        <span className="text-green-600">
                                            {cartTotalRwf >= shippingThreshold ? 'Free' : 'Negotiatable'}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100">
                                    <button
                                        onClick={handleContinueToWhatsApp}
                                        disabled={isCreatingOrder}
                                        className="w-full bg-blue-600 text-white font-bold py-5 text-xs uppercase tracking-widest hover:bg-blue-700 transition flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isCreatingOrder ? 'Processing...' : 'Complete with WhatsApp'}
                                        {!isCreatingOrder && <FaArrowRight size={12} />}
                                    </button>
                                    <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2">
                                        <FaCheckCircle className="text-green-500" /> Secure payment via WhatsApp
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
