import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type CartItem = {
  id: string;
  size?: string | null;
  quantity: number;
  price: number;
  currency?: string;
  [key: string]: any;
};

type Recommendation = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  reason: string;
};

type CartContextValue = {
  cartItems: CartItem[];
  totalAmount: number;
  totalItems: number;
  addToCart: (product: any) => void;
  removeFromCart: (productId: string, size?: string | null) => void;
  updateQuantity: (productId: string, size: string | null, newQuantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string, size?: string | null) => number;
  isItemInCart: (productId: string, size?: string | null) => boolean;
  getCartTotal: (currency?: string | null) => number;
  getRecommendations: () => Recommendation[];
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('belifeCart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      setCartItems(parsedCart);
    }
  }, []);

  // Save cart to localStorage and update totals when cartItems change
  useEffect(() => {
    localStorage.setItem('belifeCart', JSON.stringify(cartItems));

    // Calculate totals
    const items = cartItems.reduce((total, item) => total + item.quantity, 0);
    const amount = cartItems.reduce((total, item) => {
      // All items are now assumed to be in RWF
      return total + (item.price * item.quantity);
    }, 0);

    setTotalItems(items);
    setTotalAmount(amount);
  }, [cartItems]);

  const addToCart = (product: any) => {
    const qtyToAdd = product.quantity || 1;
    
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item =>
        item.id === product.id &&
        item.size === product.size
      );

      if (existingItem) {
        // If item exists, add the new quantity
        return prevItems.map(item =>
          item.id === product.id && item.size === product.size
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item
        );
      } else {
        // If item doesn't exist, add new item with its quantity
        return [...prevItems, { ...product, quantity: qtyToAdd }];
      }
    });
  };

  const removeFromCart = (productId: string, size: string | null = null) => {
    setCartItems(prevItems =>
      prevItems.filter(item =>
        !(item.id === productId && (size === null || item.size === size))
      )
    );
  };

  const updateQuantity = (productId: string, size: string | null, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, size);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId && item.size === size
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('belifeCart');
  };

  const getItemQuantity = (productId: string, size: string | null = null) => {
    const item = cartItems.find(item =>
      item.id === productId && (size === null || item.size === size)
    );
    return item ? item.quantity : 0;
  };

  const isItemInCart = (productId: string, size: string | null = null) => {
    return cartItems.some(item =>
      item.id === productId && (size === null || item.size === size)
    );
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getRecommendations = (): Recommendation[] => {
    // Get recommendations based on cart items
    const hasRing = cartItems.some(item => item.id.includes('belife-ring'));
    const hasBellBot = cartItems.some(item => item.id.includes('bellbot'));

    const recommendations: Recommendation[] = [];

    if (hasRing) {
      recommendations.push({
        id: 'ring-care-kit',
        name: 'Belife Ring Care Kit',
        description: 'Essential cleaning and maintenance kit for your Belife Ring',
        price: 25000,
        currency: 'RWF',
        image: '/ring-care.png',
        reason: 'Keep your ring in perfect condition'
      });

      recommendations.push({
        id: 'ring-sizing-tool',
        name: 'Ring Sizing Tool',
        description: 'Professional sizing tool to ensure perfect fit',
        price: 15000,
        currency: 'RWF',
        image: '/sizing-tool.png',
        reason: 'Ensure the perfect fit'
      });
    }

    if (hasBellBot) {
      recommendations.push({
        id: 'bellbot-stand',
        name: 'BellBot Charging Stand',
        description: 'Premium wireless charging stand for your BellBot',
        price: 45000,
        currency: 'RWF',
        image: '/bellbot-stand.png',
        reason: 'Convenient charging solution'
      });
    }

    // Always recommend wellness guide
    recommendations.push({
      id: 'wellness-guide',
      name: 'Digital Wellness Guide',
      description: 'Complete guide to maximizing your wellness journey with Belife products',
      price: 10000,
      currency: 'RWF',
      image: '/wellness-guide.png',
      reason: 'Maximize your product benefits'
    });

    return recommendations.slice(0, 3); // Return max 3 recommendations
  };

  const value = {
    cartItems,
    totalAmount,
    totalItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity,
    isItemInCart,
    getCartTotal,
    getRecommendations
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export { CartContext };
export default CartProvider;