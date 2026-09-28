import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLock, FaChevronRight, FaCheck, FaTruck, FaCreditCard, FaWhatsapp } from 'react-icons/fa';
import { useCart } from '../contexts/CartContext';
import { toast } from 'react-toastify';

const Checkout = () => {
    const { cartItems, clearCart, getCartTotal } = useCart();
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(1);

    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Rwanda',
        paymentMethod: 'whatsapp',
    });

    const handleInputChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const formatPrice = (price: number) => {
        return `${price.toLocaleString()} RWF`;
    };

    const validateStep = (step: number) => {
        switch (step) {
            case 1: return formData.email && formData.firstName && formData.lastName && formData.phone;
            case 2: return formData.address && formData.city && formData.state;
            case 3: return true;
            default: return false;
        }
    };

    const nextStep = () => {
        if (validateStep(currentStep)) setCurrentStep(currentStep + 1);
        else toast.error('Please fill in all required fields');
    };

    const prevStep = () => setCurrentStep(currentStep - 1);

    const handleSubmitOrder = async () => {
        const orderSummary = cartItems.map(item =>
            `${item.quantity}x ${item.name} (${item.size}) - ${formatPrice(item.price * item.quantity)}`
        ).join('%0A');

        const customerInfo = `${formData.firstName} ${formData.lastName}%0AEmail: ${formData.email}%0APhone: ${formData.phone}`;
        const shippingInfo = `${formData.address}, ${formData.city}, ${formData.state}`;

        const totalAmount = getCartTotal();

        const whatsappMessage = `Hi! I would like to complete my order:%0A%0A*Order Details:*%0A${orderSummary}%0A%0A*Customer Info:*%0A${customerInfo}%0A%0A*Shipping Address:*%0A${shippingInfo}%0A%0ATotal: ${formatPrice(totalAmount)}%0A%0APlease help me complete this purchase.`;

        window.open(`https://wa.me/250795888552?text=${whatsappMessage}`, '_blank');
        toast.success('Order details sent to WhatsApp!');
        clearCart();
        navigate('/');
    };

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
                <div className="text-center bg-white p-12 border border-gray-100 shadow-sm max-w-sm w-full">
                    <h2 className="text-xl font-bold text-gray-900 mb-2 uppercase tracking-widest">Bag is Empty</h2>
                    <p className="text-gray-500 text-sm mb-8">Add something to your bag before checking out.</p>
                    <button onClick={() => navigate('/products')} className="w-full bg-blue-600 text-white font-bold py-4 text-xs uppercase tracking-widest hover:bg-blue-700 transition">Start Shopping</button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen">
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">

                {/* Stepper */}
                <div className="flex justify-between max-w-2xl mx-auto mb-20 relative">
                    <div className="absolute top-1/2 left-0 w-full h-px bg-gray-100 -z-10"></div>
                    {[
                        { step: 1, label: 'Contact', icon: <FaLock size={10} /> },
                        { step: 2, label: 'Shipping', icon: <FaTruck size={10} /> },
                        { step: 3, label: 'Payment', icon: <FaCreditCard size={10} /> }
                    ].map((s) => (
                        <div key={s.step} className="flex flex-col items-center gap-3">
                            <div className={`w-10 h-10 border transition-all flex items-center justify-center font-bold text-[10px] uppercase tracking-widest ${currentStep >= s.step ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-400'}`}>
                                {currentStep > s.step ? <FaCheck size={12} /> : s.step}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${currentStep >= s.step ? 'text-gray-900' : 'text-gray-400'}`}>{s.label}</span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

                    {/* Form Section */}
                    <div className="lg:col-span-7 space-y-12">

                        {currentStep === 1 && (
                            <section className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-widest pb-4 border-b border-gray-100">Contact Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">First Name</label>
                                        <input name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full h-14 border border-gray-100 px-4 text-xs font-bold outline-none focus:border-blue-600 transition" placeholder="John" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Name</label>
                                        <input name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full h-14 border border-gray-100 px-4 text-xs font-bold outline-none focus:border-blue-600 transition" placeholder="Doe" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                                    <input name="email" value={formData.email} onChange={handleInputChange} className="w-full h-14 border border-gray-100 px-4 text-xs font-bold outline-none focus:border-blue-600 transition" placeholder="john@example.com" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</label>
                                    <input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full h-14 border border-gray-100 px-4 text-xs font-bold outline-none focus:border-blue-600 transition" placeholder="+250 000 000 000" />
                                </div>
                                <button onClick={nextStep} className="w-full bg-blue-600 text-white font-bold h-16 text-xs uppercase tracking-widest hover:bg-blue-700 transition">Continue to Shipping</button>
                            </section>
                        )}

                        {currentStep === 2 && (
                            <section className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-widest pb-4 border-b border-gray-100">Shipping Address</h2>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Delivery Address</label>
                                    <input name="address" value={formData.address} onChange={handleInputChange} className="w-full h-14 border border-gray-100 px-4 text-xs font-bold outline-none focus:border-blue-600 transition" placeholder="Street name, Building No." />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">City</label>
                                        <input name="city" value={formData.city} onChange={handleInputChange} className="w-full h-14 border border-gray-100 px-4 text-xs font-bold outline-none focus:border-blue-600 transition" placeholder="Kigali" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">State / Province</label>
                                        <input name="state" value={formData.state} onChange={handleInputChange} className="w-full h-14 border border-gray-100 px-4 text-xs font-bold outline-none focus:border-blue-600 transition" placeholder="Nyarugenge" />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={prevStep} className="w-32 bg-white border border-gray-100 text-gray-400 font-bold h-16 text-xs uppercase tracking-widest hover:border-gray-900 hover:text-gray-900 transition">Back</button>
                                    <button onClick={nextStep} className="flex-1 bg-blue-600 text-white font-bold h-16 text-xs uppercase tracking-widest hover:bg-blue-700 transition">Payment Method</button>
                                </div>
                            </section>
                        )}

                        {currentStep === 3 && (
                            <section className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-widest pb-4 border-b border-gray-100">Payment Selection</h2>
                                <div className="space-y-4">
                                    <div className="bg-gray-50 border border-blue-600 p-6 flex items-start gap-4">
                                        <div className="w-5 h-5 border-4 border-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">WhatsApp Direct Checkout <FaWhatsapp className="text-green-500" /></h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Pay via Momo, Cards, or Bank transfer after confirming order details with our team.</p>
                                        </div>
                                    </div>
                                    <div className="bg-white border border-gray-100 p-6 flex items-start gap-4 opacity-50 cursor-not-allowed">
                                        <div className="w-5 h-5 border border-gray-200 rounded-full flex-shrink-0 mt-1"></div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Instant Credit Card</h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Currently unavailable in your region.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={prevStep} className="w-32 bg-white border border-gray-100 text-gray-400 font-bold h-16 text-xs uppercase tracking-widest hover:border-gray-900 hover:text-gray-900 transition">Back</button>
                                    <button onClick={handleSubmitOrder} className="flex-1 bg-blue-600 text-white font-bold h-16 text-xs uppercase tracking-widest hover:bg-blue-700 transition flex items-center justify-center gap-3">Complete Order <FaChevronRight size={10} /></button>
                                </div>
                            </section>
                        )}

                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-5">
                        <div className="lg:sticky lg:top-36 border border-gray-100 p-8 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest pb-6 border-b border-gray-100 mb-8">Order Detail</h3>

                            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                                {cartItems.map((item: any) => (
                                    <div key={`${item.id}-${item.size}`} className="flex gap-4">
                                        <div className="w-16 h-16 bg-gray-50 border border-gray-100 flex-shrink-0 p-2">
                                            <img src={item.image || '/ring.png'} className="w-full h-full object-contain mix-blend-multiply" alt="" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-[10px] font-bold text-gray-900 uppercase tracking-widest leading-tight mb-1">{item.name}</h4>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Qty: {item.quantity} | {item.size}</div>
                                        </div>
                                        <div className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">{formatPrice(item.price * item.quantity)}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-8 border-t border-gray-100 space-y-4">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                                    <span className="text-gray-400">Shipping</span>
                                    <span className="text-green-600">Calculated Later</span>
                                </div>
                                <div className="flex justify-between text-base font-bold uppercase tracking-widest pt-2">
                                    <span className="text-gray-900">Total Order</span>
                                    <span className="text-blue-600">{formatPrice(getCartTotal())}</span>
                                </div>
                            </div>

                            <div className="mt-8 p-4 bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <FaLock className="text-gray-400" />
                                    <span>256-bit SSL Secure Transaction</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Checkout;
