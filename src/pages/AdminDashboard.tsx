import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FaUsers, FaBox, FaShoppingCart, FaDollarSign, FaPlus,
  FaChartLine, FaClipboardList, FaEye, FaDownload,
  FaCheckCircle, FaShippingFast, FaClock, FaArrowUp, FaCalendarAlt,
  FaBullhorn, FaVideo
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import AdminAccessDenied from '../components/AdminParts/AdminAccessDenied';
import AdminProductForm, { type AdminCategory, type AdminNewProduct } from '../components/AdminParts/AdminProductForm';
import AdminProductsGrid, { type AdminProduct } from '../components/AdminParts/AdminProductsGrid';
import mbiLogo from '../images/mbi.png';

type AdminAdvert = {
  id: string;
  title: string;
  productLink: string;
  mediaType: 'IMAGE' | 'VIDEO';
  imageUrl?: string | null;
  imagePublicId?: string | null;
  videoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
};

type AdminShowroomVideo = {
  id: string;
  title: string;
  productLink: string;
  videoUrl: string;
  isActive: boolean;
  createdAt: string;
};

type UiConfig = {
  showroomHidden: boolean;
};

type AdminCustomer = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'ADMIN' | 'CUSTOMER' | string;
  createdAt: string;
};

type AdminSupportMessage = {
  id: string;
  message: string;
  createdAt: string;
  readAt?: string | null;
  senderRole?: 'CUSTOMER' | 'ADMIN' | string;
  user: {
    id: string;
    email: string;
    name: string;
    phone: string;
    role: 'ADMIN' | 'CUSTOMER' | string;
  };
};

type AdminConversation = {
  userId: string;
  user: {
    id: string;
    email: string;
    name: string;
    phone: string;
    role: 'ADMIN' | 'CUSTOMER' | string;
  };
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
};

type AdminOrderItem = {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  currency: string;
};

type AdminOrder = {
  id: string;
  status: string;
  items: AdminOrderItem[];
  totalsByCurrency: Record<string, number>;
  createdAt: string;
  updatedAt: string;
  receivedAt?: string | null;
  underReviewAt?: string | null;
  packagingAt?: string | null;
  outForDeliveryAt?: string | null;
  deliveredAt?: string | null;
  packagingEtaMinutes?: number | null;
  deliveryEtaMinutes?: number | null;
  transportMethod?: string | null;
  transportPlateNumber?: string | null;
  user?: {
    id: string;
    email: string;
    name: string;
    phone: string;
    role: 'ADMIN' | 'CUSTOMER' | string;
  };
};

const AdminDashboard = () => {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const apiBaseUrl = useMemo(() => (process.env.REACT_APP_API_URL ?? '').replace(/\/$/, ''), []);

  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);

  const [supportMessages, setSupportMessages] = useState<AdminSupportMessage[]>([]);
  const [supportMessagesLoading, setSupportMessagesLoading] = useState(false);
  const [supportMessagesError, setSupportMessagesError] = useState<string | null>(null);

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [ordersStatusFilter, setOrdersStatusFilter] = useState('ALL');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderNextStatus, setOrderNextStatus] = useState('');
  const [orderPackagingEtaMinutes, setOrderPackagingEtaMinutes] = useState<string>('');
  const [orderDeliveryEtaMinutes, setOrderDeliveryEtaMinutes] = useState<string>('');
  const [orderTransportMethod, setOrderTransportMethod] = useState<string>('');
  const [orderTransportPlateNumber, setOrderTransportPlateNumber] = useState<string>('');
  const [savingOrder, setSavingOrder] = useState(false);

  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [selectedConversationUserId, setSelectedConversationUserId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const conversationsSignatureRef = useRef('');
  const conversationMessagesSignatureRef = useRef('');

  const computeConversationsSignature = useCallback((list: AdminConversation[]) => {
    return list.map((c) => `${c.userId}:${c.lastAt}:${c.unreadCount}`).join(';');
  }, []);

  const computeMessagesSignature = useCallback((list: AdminSupportMessage[]) => {
    const last = list[list.length - 1];
    const lastCustomer = [...list].reverse().find((m) => String(m.senderRole || 'CUSTOMER') !== 'ADMIN');
    return `${list.length}:${last?.id ?? ''}:${last?.createdAt ?? ''}:${lastCustomer?.readAt ?? ''}`;
  }, []);

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [newProduct, setNewProduct] = useState<AdminNewProduct>({
    name: '',
    description: '',
    specifications: '',
    price: '',
    currency: 'RWF',
    categoryId: '',
    inStock: true,
    isNew: false,
    productScroll: false,
    hasPromotion: false,
    discount: '',
    sizes: [],
  });

  const [adverts, setAdverts] = useState<AdminAdvert[]>([]);
  const [advertsLoading, setAdvertsLoading] = useState(false);
  const [advertsError, setAdvertsError] = useState<string | null>(null);
  const [advertTitle, setAdvertTitle] = useState('');
  const [advertProductLink, setAdvertProductLink] = useState('');
  const [advertMediaType, setAdvertMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [advertImageFile, setAdvertImageFile] = useState<File | null>(null);
  const [advertVideoUrl, setAdvertVideoUrl] = useState('');
  const [savingAdvert, setSavingAdvert] = useState(false);

  const [showroomVideos, setShowroomVideos] = useState<AdminShowroomVideo[]>([]);
  const [showroomLoading, setShowroomLoading] = useState(false);
  const [showroomError, setShowroomError] = useState<string | null>(null);
  const [showroomTitle, setShowroomTitle] = useState('');
  const [showroomProductLink, setShowroomProductLink] = useState('');
  const [showroomVideoUrl, setShowroomVideoUrl] = useState('');
  const [savingShowroom, setSavingShowroom] = useState(false);

  const [uiConfig, setUiConfig] = useState<UiConfig | null>(null);
  const [uiConfigLoading, setUiConfigLoading] = useState(false);
  const [savingUiConfig, setSavingUiConfig] = useState(false);

  const isAdmin = Boolean((user as any)?.isAdmin || (user as any)?.role === 'ADMIN');

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return orders.find((o) => o.id === selectedOrderId) ?? null;
  }, [orders, selectedOrderId]);

  const filteredOrders = useMemo(() => {
    if (ordersStatusFilter === 'ALL') return orders;
    return orders.filter((o) => String(o.status || '').toUpperCase() === ordersStatusFilter);
  }, [orders, ordersStatusFilter]);

  const formatJoinDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  };

  const loadCustomers = useCallback(async () => {
    if (!apiBaseUrl) return;
    if (!token) return;

    setCustomersLoading(true);
    setCustomersError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/users/customers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        logout('expired');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to load customers');
      }
      setCustomers(data?.customers ?? []);
    } catch (err: any) {
      const msg = err?.message || 'Failed to load customers';
      setCustomersError(msg);
      toast.error(msg);
    } finally {
      setCustomersLoading(false);
    }
  }, [apiBaseUrl, token, logout]);

  const loadConversations = useCallback(async (opts?: { silent?: boolean }) => {
    if (!apiBaseUrl || !token) return;
    const silent = Boolean(opts?.silent);
    if (!silent) {
      setConversationsLoading(true);
      setConversationsError(null);
    }
    try {
      const res = await fetch(`${apiBaseUrl}/api/support/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        logout('expired');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to load conversations');
      }
      const list = (data?.conversations ?? []) as any[];
      const next = list.map((c) => ({
        userId: c.userId,
        user: c.user,
        lastMessage: c.lastMessage,
        lastAt: c.lastAt,
        unreadCount: c.unreadCount ?? 0,
      })) as AdminConversation[];
      const signature = computeConversationsSignature(next);
      if (signature !== conversationsSignatureRef.current) {
        conversationsSignatureRef.current = signature;
        setConversations(next);
      }
    } catch (err: any) {
      if (!silent) {
        const msg = err?.message || 'Failed to load conversations';
        setConversationsError(msg);
        toast.error(msg);
      }
    } finally {
      if (!silent) setConversationsLoading(false);
    }
  }, [apiBaseUrl, token, computeConversationsSignature, logout]);

  const loadConversationMessages = useCallback(async (userId: string, opts?: { silent?: boolean }) => {
    if (!apiBaseUrl || !token) return;
    const silent = Boolean(opts?.silent);
    if (!silent) {
      setSupportMessagesLoading(true);
      setSupportMessagesError(null);
    }
    try {
      const res = await fetch(`${apiBaseUrl}/api/support/conversations/${userId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        logout('expired');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to load messages');
      }
      const serverMessages = (data?.messages ?? []) as AdminSupportMessage[];
      const signature = computeMessagesSignature(serverMessages);
      if (signature !== conversationMessagesSignatureRef.current) {
        conversationMessagesSignatureRef.current = signature;
        setSupportMessages(serverMessages);
      }
    } catch (err: any) {
      if (!silent) {
        const msg = err?.message || 'Failed to load messages';
        setSupportMessagesError(msg);
        toast.error(msg);
      }
    } finally {
      if (!silent) setSupportMessagesLoading(false);
    }
  }, [apiBaseUrl, token, computeMessagesSignature, logout]);

  const markConversationRead = useCallback(async (userId: string) => {
    if (!apiBaseUrl || !token) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/support/conversations/${userId}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        logout('expired');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to mark read');
      }
      setConversations((prev) => prev.map((c) => (c.userId === userId ? { ...c, unreadCount: 0 } : c)));
    } catch {
      // ignore
    }
  }, [apiBaseUrl, token, logout]);

  const handleSelectConversation = async (userId: string) => {
    setSelectedConversationUserId(userId);
    setReplyDraft('');
    await loadConversationMessages(userId, { silent: false });
    await markConversationRead(userId);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversationUserId) return;
    if (!apiBaseUrl || !token) {
      toast.error('Missing configuration or session');
      return;
    }

    const msg = replyDraft.trim();
    if (!msg) {
      toast.error('Please type a message');
      return;
    }

    setSendingReply(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/support/conversations/${selectedConversationUserId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: msg }),
      });
      if (res.status === 401) {
        logout('expired');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to send message');
      }
      setReplyDraft('');
      const created = data?.message as any;
      if (created?.id) {
        setSupportMessages((prev) => {
          const next = [...prev, created];
          conversationMessagesSignatureRef.current = computeMessagesSignature(next as any);
          return next as any;
        });
      } else {
        await loadConversationMessages(selectedConversationUserId, { silent: true });
      }
      await loadConversations({ silent: true });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send message');
    } finally {
      setSendingReply(false);
    }
  };

  const revenueTotalsByCurrency = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const order of orders) {
      const perOrder = (order.totalsByCurrency ?? {}) as Record<string, any>;
      for (const [currency, amount] of Object.entries(perOrder)) {
        const numeric = typeof amount === 'number' ? amount : Number(amount);
        if (!Number.isFinite(numeric)) continue;
        totals[currency] = (totals[currency] ?? 0) + numeric;
      }
    }
    return totals;
  }, [orders]);

  const totalRevenueRwf = revenueTotalsByCurrency['RWF'] ?? 0;

  const stats = {
    totalOrders: orders.length,
    totalCustomers: customers.length,
    totalRevenue: totalRevenueRwf,
    totalProducts: adminProducts.length,
  };

  const ordersByStatusChart = useMemo(() => {
    const statuses = [
      'ORDERED',
      'RECEIVED',
      'UNDER_REVIEW',
      'PACKAGING',
      'PROCESSING',
      'SHIPPED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
    ];

    const counts = new Map<string, number>();
    for (const s of statuses) counts.set(s, 0);
    for (const o of orders) {
      const s = String(o.status || '').toUpperCase();
      if (counts.has(s)) counts.set(s, (counts.get(s) ?? 0) + 1);
      else counts.set(s, (counts.get(s) ?? 0) + 1);
    }

    const values = Array.from(counts.values());
    const max = Math.max(1, ...values);

    const labelize = (status: string) => {
      const parts = status.split('_').filter(Boolean);
      return parts
        .map((p, idx) => {
          const lower = p.toLowerCase();
          if (idx === 0) return lower.charAt(0).toUpperCase() + lower.slice(1);
          return lower;
        })
        .join(' ');
    };

    return statuses.map((status) => {
      const count = counts.get(status) ?? 0;
      const widthPct = Math.round((count / max) * 100);
      return {
        status,
        label: labelize(status),
        count,
        widthPct,
      };
    });
  }, [orders]);

  const formatOrderDateTime = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString();
  };

  const formatTotals = (totalsByCurrency: Record<string, number>) => {
    const entries = Object.entries(totalsByCurrency ?? {});
    if (entries.length === 0) return '0';
    if (entries.length === 1) {
      const [cur, amt] = entries[0];
      return `${Number(amt || 0).toLocaleString()} ${cur}`;
    }
    return entries
      .map(([cur, amt]) => `${Number(amt || 0).toLocaleString()} ${cur}`)
      .join(' + ');
  };

  const loadOrders = useCallback(async () => {
    if (!apiBaseUrl || !token) return;
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        logout('expired');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to load orders');
      }
      setOrders(data?.orders ?? []);
    } catch (err: any) {
      const msg = err?.message || 'Failed to load orders';
      setOrdersError(msg);
      toast.error(msg);
    } finally {
      setOrdersLoading(false);
    }
  }, [apiBaseUrl, token, logout]);

  const loadAdvertsAdmin = useCallback(async () => {
    if (!apiBaseUrl || !token) return;
    setAdvertsLoading(true);
    setAdvertsError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/adverts/admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        logout('expired');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to load adverts');
      }
      setAdverts(Array.isArray(data?.adverts) ? data.adverts : []);
    } catch (err: any) {
      const msg = err?.message || 'Failed to load adverts';
      setAdvertsError(msg);
      toast.error(msg);
    } finally {
      setAdvertsLoading(false);
    }
  }, [apiBaseUrl, token, logout]);

  const loadShowroomAdmin = useCallback(async () => {
    if (!apiBaseUrl || !token) return;
    setShowroomLoading(true);
    setShowroomError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/showroom/admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        logout('expired');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to load showroom videos');
      }
      setShowroomVideos(Array.isArray(data?.videos) ? data.videos : []);
    } catch (err: any) {
      const msg = err?.message || 'Failed to load showroom videos';
      setShowroomError(msg);
      toast.error(msg);
    } finally {
      setShowroomLoading(false);
    }
  }, [apiBaseUrl, token, logout]);

  const loadUiConfig = useCallback(async () => {
    if (!apiBaseUrl) return;
    setUiConfigLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/ui-config`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to load UI config');
      }
      setUiConfig({ showroomHidden: Boolean(data?.config?.showroomHidden) });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load UI config');
    } finally {
      setUiConfigLoading(false);
    }
  }, [apiBaseUrl]);

  const updateUiConfig = useCallback(async (next: UiConfig) => {
    if (!apiBaseUrl || !token) {
      toast.error('Missing configuration or session');
      return;
    }
    setSavingUiConfig(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/ui-config`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(next),
      });
      if (res.status === 401) {
        logout('expired');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to update UI config');
      }
      setUiConfig({ showroomHidden: Boolean(data?.config?.showroomHidden) });
      toast.success('Updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update UI config');
    } finally {
      setSavingUiConfig(false);
    }
  }, [apiBaseUrl, token, logout]);

  const customerOrderMetrics = useMemo(() => {
    const byCustomerId = new Map<string, { orderCount: number; totalsByCurrency: Record<string, number> }>();

    for (const order of orders) {
      const customerId = (order as any)?.userId || order.user?.id;
      if (!customerId) continue;

      const existing = byCustomerId.get(customerId) ?? { orderCount: 0, totalsByCurrency: {} };
      existing.orderCount += 1;

      const totals = (order.totalsByCurrency ?? {}) as Record<string, any>;
      for (const [currency, amount] of Object.entries(totals)) {
        const numeric = typeof amount === 'number' ? amount : Number(amount);
        if (!Number.isFinite(numeric)) continue;
        existing.totalsByCurrency[currency] = (existing.totalsByCurrency[currency] ?? 0) + numeric;
      }

      byCustomerId.set(customerId, existing);
    }

    return byCustomerId;
  }, [orders]);

  useEffect(() => {
    if (!isAdmin) return;
    if (orders.length > 0) return;
    if (!apiBaseUrl || !token) return;
    if (activeTab !== 'overview') return;
    loadOrders();
  }, [isAdmin, orders.length, apiBaseUrl, token, activeTab, loadOrders]);

  useEffect(() => {
    if (!selectedOrder) return;
    setOrderNextStatus('');
    setOrderPackagingEtaMinutes(selectedOrder.packagingEtaMinutes != null ? String(selectedOrder.packagingEtaMinutes) : '');
    setOrderDeliveryEtaMinutes(selectedOrder.deliveryEtaMinutes != null ? String(selectedOrder.deliveryEtaMinutes) : '');
    setOrderTransportMethod(selectedOrder.transportMethod ?? '');
    setOrderTransportPlateNumber(selectedOrder.transportPlateNumber ?? '');
  }, [selectedOrder]);

  const handleSaveOrderUpdate = async () => {
    if (!selectedOrderId) return;
    if (!apiBaseUrl || !token) {
      toast.error('Missing configuration or session');
      return;
    }

    const payload: any = {};

    const status = orderNextStatus.trim();
    if (status) payload.status = status;

    if (orderPackagingEtaMinutes.trim()) {
      const v = Number.parseInt(orderPackagingEtaMinutes, 10);
      if (!Number.isFinite(v) || v < 0) {
        toast.error('Packaging time must be a valid number (minutes)');
        return;
      }
      payload.packagingEtaMinutes = v;
    }

    if (orderDeliveryEtaMinutes.trim()) {
      const v = Number.parseInt(orderDeliveryEtaMinutes, 10);
      if (!Number.isFinite(v) || v < 0) {
        toast.error('Delivery time must be a valid number (minutes)');
        return;
      }
      payload.deliveryEtaMinutes = v;
    }

    if (orderTransportMethod.trim()) payload.transportMethod = orderTransportMethod.trim();
    if (orderTransportPlateNumber.trim()) payload.transportPlateNumber = orderTransportPlateNumber.trim();

    if (payload.status === 'OUT_FOR_DELIVERY') {
      const method = (payload.transportMethod ?? '').trim();
      const plate = (payload.transportPlateNumber ?? '').trim();
      if (!method) {
        toast.error('Please select a transport method');
        return;
      }
      if (!plate) {
        toast.error('Please enter the plate number');
        return;
      }
    }

    if (Object.keys(payload).length === 0) {
      toast.error('Nothing to update');
      return;
    }

    setSavingOrder(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/orders/${selectedOrderId}/admin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        logout('expired');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to update order');
      }
      const updated = data?.order as AdminOrder;
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      toast.success('Order updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update order');
    } finally {
      setSavingOrder(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (activeTab !== 'products') return;
      if (!apiBaseUrl) return;

      setProductsLoading(true);
      setCategoriesLoading(true);

      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/products`),
          fetch(`${apiBaseUrl}/api/categories`),
        ]);

        const productsData = await productsRes.json().catch(() => ({}));
        if (!productsRes.ok) throw new Error(productsData?.error || 'Failed to load products');
        setAdminProducts(productsData?.products ?? []);

        const categoriesData = await categoriesRes.json().catch(() => ({}));
        if (!categoriesRes.ok) throw new Error(categoriesData?.error || 'Failed to load categories');
        setCategories(categoriesData?.categories ?? []);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load products');
      } finally {
        setProductsLoading(false);
        setCategoriesLoading(false);
      }
    };

    load();
  }, [activeTab, apiBaseUrl]);

  useEffect(() => {
    if (!isAdmin) return;
    if (!apiBaseUrl || !token) return;
    loadCustomers();
  }, [isAdmin, apiBaseUrl, token, loadCustomers]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab !== 'messages') return;
    if (!apiBaseUrl || !token) return;
    loadConversations({ silent: false });
  }, [isAdmin, activeTab, apiBaseUrl, token, loadConversations]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab !== 'orders') return;
    if (!apiBaseUrl || !token) return;
    loadOrders();
  }, [isAdmin, activeTab, apiBaseUrl, token, loadOrders]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab !== 'adverts') return;
    if (!apiBaseUrl || !token) return;
    loadAdvertsAdmin();
  }, [isAdmin, activeTab, apiBaseUrl, token, loadAdvertsAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab !== 'showroom') return;
    if (!apiBaseUrl || !token) return;
    loadShowroomAdmin();
  }, [isAdmin, activeTab, apiBaseUrl, token, loadShowroomAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab !== 'showroom') return;
    if (!apiBaseUrl) return;
    loadUiConfig();
  }, [isAdmin, activeTab, apiBaseUrl, loadUiConfig]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab !== 'customers') return;
    if (!apiBaseUrl || !token) return;
    if (orders.length > 0) return;
    loadOrders();
  }, [isAdmin, activeTab, apiBaseUrl, token, orders.length, loadOrders]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab !== 'messages') return;
    if (!apiBaseUrl || !token) return;

    const id = window.setInterval(() => {
      loadConversations({ silent: true });
      if (selectedConversationUserId) {
        loadConversationMessages(selectedConversationUserId, { silent: true });
      }
    }, 4000);

    return () => window.clearInterval(id);
  }, [isAdmin, activeTab, apiBaseUrl, token, loadConversations, selectedConversationUserId, loadConversationMessages]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab !== 'messages') return;
    if (!selectedConversationUserId) return;
    const el = document.getElementById('admin-support-chat-scroll');
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [isAdmin, activeTab, selectedConversationUserId, supportMessages.length]);

  // (Old per-message mark-read kept on backend for compatibility; UI now uses conversation-level read.)

  useEffect(() => {
    if (categories.length === 0) return;
    setNewProduct((p) => {
      if (p.categoryId) return p;
      return { ...p, categoryId: categories[0].id };
    });
  }, [categories]);

  const handleNewProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setNewProduct((p) => ({ ...p, [name]: checked }));
      return;
    }
    setNewProduct((p) => ({ ...p, [name]: value }));
  };

  const handleSizeChange = (size: string, checked: boolean) => {
    setNewProduct((p) => {
      const newSizes = checked
        ? [...p.sizes, size]
        : p.sizes.filter((s) => s !== size);
      return { ...p, sizes: newSizes };
    });
  };

  const resetForm = () => {
    setNewProduct({
      name: '',
      description: '',
      specifications: '',
      price: '',
      currency: 'RWF',
      categoryId: categories[0]?.id ?? '',
      inStock: true,
      isNew: false,
      productScroll: false,
      hasPromotion: false,
      discount: '',
      sizes: [],
    });
    setImageFiles([]);
    setEditingProduct(null);
    setShowAddProduct(false);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiBaseUrl) {
      toast.error('Missing REACT_APP_API_URL (frontend/.env)');
      return;
    }
    if (!token) {
      toast.error('You must be logged in as admin');
      return;
    }
    if (!newProduct.name || !newProduct.description || !newProduct.price) {
      toast.error('Please fill in name, description, and price');
      return;
    }
    if (!newProduct.categoryId) {
      toast.error('Please choose a category');
      return;
    }
    if (!editingProduct && imageFiles.length === 0) {
      toast.error('Please choose at least one image');
      return;
    }

    let discountInt: number | undefined;
    if (newProduct.hasPromotion) {
      if (!newProduct.discount) {
        toast.error('Please provide a discount percentage');
        return;
      }
      discountInt = Number.parseInt(newProduct.discount, 10);
      if (!Number.isFinite(discountInt) || discountInt < 1 || discountInt > 90) {
        toast.error('Discount must be a number between 1 and 90');
        return;
      }
    }

    const priceInt = Number.parseInt(newProduct.price, 10);
    if (!Number.isFinite(priceInt) || priceInt < 0) {
      toast.error('Price must be a valid number');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrls = editingProduct?.imageUrls || [];
      let imagePublicIds = editingProduct?.imagePublicIds || [];

      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const sigRes = await fetch(`${apiBaseUrl}/api/uploads/cloudinary-signature`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({}),
          });
          const sigData = await sigRes.json().catch(() => ({}));
          if (!sigRes.ok || !sigData?.ok) {
            throw new Error(sigData?.error || 'Failed to get upload signature');
          }

          const uploadForm = new FormData();
          uploadForm.append('file', file);
          uploadForm.append('api_key', String(sigData.apiKey));
          uploadForm.append('timestamp', String(sigData.timestamp));
          uploadForm.append('signature', String(sigData.signature));
          uploadForm.append('folder', String(sigData.folder));

          const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`, {
            method: 'POST',
            body: uploadForm,
          });
          const uploadData: any = await uploadRes.json().catch(() => ({}));
          if (!uploadRes.ok) {
            throw new Error(uploadData?.error?.message || 'Cloudinary upload failed');
          }

          if (uploadData?.secure_url && uploadData?.public_id) {
            imageUrls = [...imageUrls, uploadData.secure_url];
            imagePublicIds = [...imagePublicIds, uploadData.public_id];
          }
        }
      }

      const features = newProduct.specifications
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const url = editingProduct
        ? `${apiBaseUrl}/api/products/${editingProduct.id}`
        : `${apiBaseUrl}/api/products`;

      const method = editingProduct ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newProduct.name,
          description: newProduct.description,
          price: priceInt,
          currency: newProduct.currency,
          categoryId: newProduct.categoryId,
          inStock: Boolean(newProduct.inStock),
          isNew: Boolean(newProduct.isNew),
          productScroll: Boolean(newProduct.productScroll),
          discount: discountInt,
          sizes: newProduct.sizes.length > 0 ? newProduct.sizes : ['Standard'],
          features,
          imageUrls,
          imagePublicIds,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Failed to ${editingProduct ? 'update' : 'create'} product`);
      }

      toast.success(editingProduct ? 'Product updated successfully' : 'Product uploaded successfully');
      resetForm();

      const listRes = await fetch(`${apiBaseUrl}/api/products`);
      const listData = await listRes.json();
      if (listRes.ok) setAdminProducts(listData?.products ?? []);
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (!apiBaseUrl) {
      toast.error('Missing REACT_APP_API_URL (frontend/.env)');
      return;
    }
    if (!token) {
      toast.error('You must be logged in as admin');
      return;
    }

    setIsCreatingCategory(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to create category');
      }

      toast.success('Category created');
      setNewCategoryName('');

      const listRes = await fetch(`${apiBaseUrl}/api/categories`);
      const listData = await listRes.json().catch(() => ({}));
      if (listRes.ok) {
        setCategories(listData?.categories ?? []);
      }

      const createdId = data?.category?.id as string | undefined;
      if (createdId) {
        setNewProduct((p) => ({ ...p, categoryId: createdId }));
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create category');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleEditProduct = (product: AdminProduct) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description,
      specifications: product.features?.join('\n') || '',
      price: String(product.price),
      currency: product.currency,
      categoryId: product.categoryId || '',
      inStock: product.inStock,
      isNew: product.isNew,
      productScroll: Boolean(product.productScroll),
      hasPromotion: Boolean(product.discount),
      discount: product.discount ? String(product.discount) : '',
      sizes: product.sizes || [],
    });
    setShowAddProduct(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Confirm permanent deletion of this asset?')) {
      return;
    }

    if (!apiBaseUrl || !token) {
      toast.error('Missing configuration or session');
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success('Product deleted successfully');
        setAdminProducts((prev) => prev.filter((p) => p.id !== productId));
      } else {
        throw new Error(data?.error || 'Failed to delete product');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Delete failed');
    }
  };

  const resetAdvertForm = () => {
    setAdvertTitle('');
    setAdvertProductLink('');
    setAdvertMediaType('IMAGE');
    setAdvertImageFile(null);
    setAdvertVideoUrl('');
  };

  const resetShowroomForm = () => {
    setShowroomTitle('');
    setShowroomProductLink('');
    setShowroomVideoUrl('');
  };

  const handleCreateAdvert = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiBaseUrl) {
      toast.error('Missing REACT_APP_API_URL (frontend/.env)');
      return;
    }
    if (!token) {
      toast.error('You must be logged in as admin');
      return;
    }

    const title = advertTitle.trim();
    const productLink = advertProductLink.trim();

    if (!title) {
      toast.error('Please provide an advert title');
      return;
    }
    if (!productLink || !productLink.startsWith('/product/')) {
      toast.error('Product link must start with /product/');
      return;
    }

    setSavingAdvert(true);
    try {
      const payload: any = {
        title,
        productLink,
        mediaType: advertMediaType,
      };

      if (advertMediaType === 'IMAGE') {
        if (!advertImageFile) {
          toast.error('Please choose an advert image');
          return;
        }

        const sigRes = await fetch(`${apiBaseUrl}/api/uploads/cloudinary-signature`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ folder: 'banners' }),
        });
        if (sigRes.status === 401) {
          logout('expired');
          return;
        }
        const sigData = await sigRes.json().catch(() => ({}));
        if (!sigRes.ok || !sigData?.ok) {
          throw new Error(sigData?.error || 'Failed to get upload signature');
        }

        const uploadForm = new FormData();
        uploadForm.append('file', advertImageFile);
        uploadForm.append('api_key', String(sigData.apiKey));
        uploadForm.append('timestamp', String(sigData.timestamp));
        uploadForm.append('signature', String(sigData.signature));
        uploadForm.append('folder', String(sigData.folder));

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`, {
          method: 'POST',
          body: uploadForm,
        });
        const uploadData: any = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) {
          throw new Error(uploadData?.error?.message || 'Cloudinary upload failed');
        }

        payload.imageUrl = uploadData?.secure_url;
        payload.imagePublicId = uploadData?.public_id;
      } else {
        const videoUrl = advertVideoUrl.trim();
        if (!videoUrl) {
          toast.error('Please provide a video URL');
          return;
        }
        payload.videoUrl = videoUrl;
      }

      const res = await fetch(`${apiBaseUrl}/api/adverts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        logout('expired');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to create advert');
      }

      toast.success('Advert created');
      resetAdvertForm();
      await loadAdvertsAdmin();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create advert');
    } finally {
      setSavingAdvert(false);
    }
  };

  const handleDeleteAdvert = async (advertId: string) => {
    if (!window.confirm('Delete this advert?')) return;
    if (!apiBaseUrl || !token) {
      toast.error('Missing configuration or session');
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/adverts/${advertId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        logout('expired');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to delete advert');
      }
      toast.success('Advert deleted');
      setAdverts((prev) => prev.filter((a) => a.id !== advertId));
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete advert');
    }
  };

  const handleToggleAdvertActive = async (ad: AdminAdvert) => {
    if (!apiBaseUrl || !token) {
      toast.error('Missing configuration or session');
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/adverts/${ad.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !ad.isActive }),
      });
      if (res.status === 401) {
        logout('expired');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to update advert');
      }
      const updated = data?.advert as AdminAdvert;
      setAdverts((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update advert');
    }
  };

  const handleCreateShowroomVideo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiBaseUrl) {
      toast.error('Missing REACT_APP_API_URL (frontend/.env)');
      return;
    }
    if (!token) {
      toast.error('You must be logged in as admin');
      return;
    }

    const title = showroomTitle.trim();
    const productLink = showroomProductLink.trim();
    const videoUrl = showroomVideoUrl.trim();

    if (!title) {
      toast.error('Please provide a showroom title');
      return;
    }
    if (!productLink || !productLink.startsWith('/product/')) {
      toast.error('Product link must start with /product/');
      return;
    }
    if (!videoUrl) {
      toast.error('Please provide a video URL');
      return;
    }

    setSavingShowroom(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/showroom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, productLink, videoUrl }),
      });
      if (res.status === 401) {
        logout('expired');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to create showroom video');
      }

      toast.success('Showroom video created');
      resetShowroomForm();
      await loadShowroomAdmin();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create showroom video');
    } finally {
      setSavingShowroom(false);
    }
  };

  const handleDeleteShowroomVideo = async (videoId: string) => {
    if (!window.confirm('Delete this showroom video?')) return;
    if (!apiBaseUrl || !token) {
      toast.error('Missing configuration or session');
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/showroom/${videoId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        logout('expired');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to delete showroom video');
      }
      toast.success('Showroom video deleted');
      setShowroomVideos((prev) => prev.filter((v) => v.id !== videoId));
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete showroom video');
    }
  };

  const handleToggleShowroomActive = async (v: AdminShowroomVideo) => {
    if (!apiBaseUrl || !token) {
      toast.error('Missing configuration or session');
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/api/showroom/${v.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !v.isActive }),
      });
      if (res.status === 401) {
        logout('expired');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to update showroom video');
      }
      const updated = data?.video as AdminShowroomVideo;
      setShowroomVideos((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update showroom video');
    }
  };

  const normalizeStatus = (status: string) => String(status || '').toUpperCase();

  const getStatusLabel = (status: string) => {
    const s = normalizeStatus(status);
    if (s === 'ORDERED') return 'Ordered';
    if (s === 'RECEIVED') return 'Received';
    if (s === 'UNDER_REVIEW') return 'Under Review';
    if (s === 'PACKAGING') return 'Packaging';
    if (s === 'PROCESSING') return 'Processing';
    if (s === 'SHIPPED') return 'Shipped';
    if (s === 'OUT_FOR_DELIVERY') return 'Out for delivery';
    if (s === 'DELIVERED') return 'Delivered';
    return status || 'Unknown';
  };

  const getStatusIcon = (status: string) => {
    const s = normalizeStatus(status);
    if (s === 'DELIVERED') return <FaCheckCircle size={8} />;
    if (s === 'OUT_FOR_DELIVERY' || s === 'SHIPPED') return <FaShippingFast size={8} />;
    return <FaClock size={8} />;
  };

  const getStatusStyle = (status: string) => {
    const s = normalizeStatus(status);
    if (s === 'DELIVERED') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (s === 'OUT_FOR_DELIVERY' || s === 'SHIPPED') return 'bg-amber-50 text-amber-700 border-amber-100';
    if (s === 'PACKAGING' || s === 'UNDER_REVIEW' || s === 'RECEIVED' || s === 'PROCESSING') {
      return 'bg-blue-50 text-blue-700 border-blue-100';
    }
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  if (!isAdmin) {
    return <AdminAccessDenied />;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 lg:px-12 font-outfit selection:bg-blue-600 selection:text-white">
      <div className="max-w-[1400px] mx-auto">

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-gray-100 pb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-10 h-[1px] bg-blue-600"></span>
              <span className="text-[10px] font-bold text-gray-900 uppercase tracking-[0.3em]">Management Console</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tightest mb-2 uppercase">
              Operational Overview
            </h1>
            <p className="text-[11px] font-medium text-gray-600 uppercase tracking-widest">
              Session Active: {user?.name} — Admin Identity Verified
            </p>
          </div>

          <div className="flex gap-4">
            <div className="border border-gray-100 p-4 min-w-[160px]">
              <span className="block text-[8px] font-bold text-gray-600 uppercase tracking-widest mb-1">Local Time</span>
              <span className="block text-xs font-bold text-gray-900 uppercase">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="border border-gray-100 p-4 min-w-[160px]">
              <span className="block text-[8px] font-bold text-gray-600 uppercase tracking-widest mb-1">System Status</span>
              <span className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Optimal
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto overflow-y-hidden scrollbar-hide border-b border-gray-100 mb-12">
          {[
            { id: 'overview', label: 'Dashboard', icon: <FaChartLine size={12} /> },
            { id: 'orders', label: 'Order Flow', icon: <FaClipboardList size={12} /> },
            { id: 'products', label: 'Inventory', icon: <FaBox size={12} /> },
            { id: 'adverts', label: 'Adverts', icon: <FaBullhorn size={12} /> },
            { id: 'showroom', label: 'Showroom', icon: <FaVideo size={12} /> },
            { id: 'messages', label: 'Messages', icon: <FaEye size={12} /> },
            { id: 'customers', label: 'Customers', icon: <FaUsers size={12} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 py-6 px-8 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === tab.id
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
                }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
          ))}
        </div>

        <div className="animate-in fade-in duration-700 slide-in-from-bottom-2">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-12">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200 border border-gray-200">
                {[
                  { label: 'Cumulative Orders', value: stats.totalOrders.toLocaleString(), sub: '+12.5% this month', icon: <FaShoppingCart size={14} /> },
                  { label: 'Active Entities', value: customersLoading ? '...' : stats.totalCustomers.toLocaleString(), sub: 'Verified users', icon: <FaUsers size={14} /> },
                  { label: 'Gross Liquidity', value: ordersLoading ? '...' : `${(stats.totalRevenue / 1000).toFixed(1)}k`, sub: 'RWF Valuation', icon: <FaDollarSign size={14} /> },
                  { label: 'Active Listings', value: stats.totalProducts, sub: 'Inventory units', icon: <FaBox size={14} /> }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white p-8 group hover:bg-gray-50 transition-colors duration-500">
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{stat.label}</span>
                      <div className="text-blue-600 group-hover:scale-110 transition-transform">{stat.icon}</div>
                    </div>
                    <div className="text-4xl font-bold text-gray-900 tracking-tighter mb-2">
                      {stat.value}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FaArrowUp size={8} className="text-emerald-500" />
                      <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">{stat.sub}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Analytics Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Chart 1: Orders by Status (Bar Chart) */}
                <div className="lg:col-span-12 xl:col-span-7 border border-gray-100 p-10">
                  <div className="flex justify-between items-end mb-12">
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">Orders by Status</h3>
                      <p className="text-[10px] text-gray-600 font-medium uppercase tracking-widest">Live distribution from your database</p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    {ordersLoading && (
                      <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Loading orders…</div>
                    )}

                    {!ordersLoading && orders.length === 0 && (
                      <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">No orders yet</div>
                    )}

                    {!ordersLoading && orders.length > 0 && (
                      <div className="space-y-4">
                        {ordersByStatusChart.map((row) => (
                          <div key={row.status} className="grid grid-cols-12 items-center gap-4">
                            <div className="col-span-4">
                              <div className="text-[9px] font-bold text-gray-700 uppercase tracking-widest">{row.label}</div>
                            </div>
                            <div className="col-span-7">
                              <div className="h-3 bg-gray-100 border border-gray-200">
                                <div className="h-full bg-blue-600" style={{ width: `${row.widthPct}%` }} />
                              </div>
                            </div>
                            <div className="col-span-1 text-right">
                              <div className="text-[10px] font-bold text-gray-900 tracking-tight">{row.count}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Chart 2: Capital Inflow */}
                <div className="lg:col-span-12 xl:col-span-5 border border-gray-100 p-10 bg-white">
                  <div className="flex justify-between items-end mb-12">
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">Capital Inflow</h3>
                      <p className="text-[10px] text-gray-600 font-medium uppercase tracking-widest">RWF Revenue Projections</p>
                    </div>
                    <FaDownload size={10} className="text-gray-500 cursor-pointer hover:text-blue-600 transition" />
                  </div>
                  <div className="flex items-end justify-between h-56 gap-3">
                    {[30, 45, 38, 65, 58, 85].map((val, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                        <div className="w-full bg-gray-50 group-hover:bg-gray-100 transition-all duration-700 relative flex flex-col justify-end" style={{ height: `100%` }}>
                          <div className="w-full bg-blue-600 transition-all duration-700" style={{ height: `${val}%` }}></div>
                          <span className="absolute -top-6 left-0 right-0 text-center text-[8px] font-bold text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity">
                            {val}K
                          </span>
                        </div>
                        <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">
                          {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="border border-gray-100">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Recent Transactions</h3>
                  <button className="text-[10px] font-bold text-gray-700 uppercase tracking-widest hover:text-gray-900">[ View All Ledger ]</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-6 text-[9px] font-bold text-gray-600 uppercase tracking-widest border-b border-gray-100">Order Ref</th>
                        <th className="p-6 text-[9px] font-bold text-gray-600 uppercase tracking-widest border-b border-gray-100">Client</th>
                        <th className="p-6 text-[9px] font-bold text-gray-600 uppercase tracking-widest border-b border-gray-100">Asset</th>
                        <th className="p-6 text-[9px] font-bold text-gray-600 uppercase tracking-widest border-b border-gray-100">Valuation</th>
                        <th className="p-6 text-[9px] font-bold text-gray-600 uppercase tracking-widest border-b border-gray-100">Status</th>
                        <th className="p-6 text-[9px] font-bold text-gray-600 uppercase tracking-widest border-b border-gray-100">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.slice(0, 5).map((order) => {
                        const first = order.items?.[0];
                        const productLabel = first
                          ? `${first.name}${order.items.length > 1 ? ` +${order.items.length - 1}` : ''}`
                          : '—';
                        const customerLabel = (order.user?.name || order.user?.email || 'Customer').toUpperCase();
                        return (
                          <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-6 text-[11px] font-bold text-gray-900 tracking-tighter">{order.id}</td>
                            <td className="p-6 text-[10px] font-bold text-gray-700 uppercase tracking-tight">{customerLabel}</td>
                            <td className="p-6 text-[10px] font-bold text-gray-700 uppercase tracking-tight">{productLabel}</td>
                            <td className="p-6 text-[11px] font-bold text-gray-900 tracking-tighter">{formatTotals(order.totalsByCurrency)}</td>
                            <td className="p-6">
                              <span className={`px-3 py-1 text-[8px] font-bold uppercase tracking-widest border ${getStatusStyle(order.status)}`}>
                                {getStatusLabel(order.status)}
                              </span>
                            </td>
                            <td className="p-6 text-[10px] font-bold text-gray-600 tracking-tight">{formatOrderDateTime(order.createdAt)}</td>
                          </tr>
                        );
                      })}

                      {!ordersLoading && orders.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-16 text-center">
                            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">No orders yet</span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="border border-gray-100">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Order Synchronization Ledger</h3>
                <div className="flex gap-4">
                  <div className="relative">
                    <select
                      value={ordersStatusFilter}
                      onChange={(e) => setOrdersStatusFilter(e.target.value)}
                      className="appearance-none bg-white border border-gray-200 px-4 pr-10 h-10 text-[9px] font-bold uppercase tracking-widest outline-none focus:border-blue-600"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ORDERED">Ordered</option>
                      <option value="RECEIVED">Received</option>
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="PACKAGING">Packaging</option>
                      <option value="OUT_FOR_DELIVERY">Out for delivery</option>
                      <option value="DELIVERED">Delivered</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <FaCalendarAlt size={10} className="text-gray-500" />
                    </div>
                  </div>
                  <button className="px-6 h-10 border border-blue-600 text-blue-600 text-[9px] font-bold uppercase tracking-widest hover:bg-blue-600 hover:text-white transition">Export CSV</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white">
                      <th className="p-6 text-[9px] font-bold text-gray-600 uppercase tracking-widest">Identifier</th>
                      <th className="p-6 text-[9px] font-bold text-gray-600 uppercase tracking-widest">Client Identity</th>
                      <th className="p-6 text-[9px] font-bold text-gray-600 uppercase tracking-widest">Product Catalog</th>
                      <th className="p-6 text-[9px] font-bold text-gray-600 uppercase tracking-widest">Net Valuation</th>
                      <th className="p-6 text-[9px] font-bold text-gray-600 uppercase tracking-widest">Operational State</th>
                      <th className="p-6 text-[9px] font-bold text-gray-600 uppercase tracking-widest">Intervention</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                    {ordersLoading && (
                      <tr>
                        <td colSpan={6} className="p-20 text-center">
                          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em] animate-pulse">Loading...</span>
                        </td>
                      </tr>
                    )}

                    {!ordersLoading && ordersError && (
                      <tr>
                        <td colSpan={6} className="p-20 text-center">
                          <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{ordersError}</span>
                        </td>
                      </tr>
                    )}

                    {!ordersLoading && !ordersError && filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-20 text-center">
                          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">No orders</span>
                        </td>
                      </tr>
                    )}

                    {!ordersLoading && !ordersError && filteredOrders.map((order) => {
                      const first = order.items?.[0];
                      const productLabel = first
                        ? `${first.name}${order.items.length > 1 ? ` +${order.items.length - 1}` : ''}`
                        : '—';
                      const customerLabel = (order.user?.name || order.user?.email || 'Customer').toUpperCase();
                      const isSelected = selectedOrderId === order.id;

                      return (
                        <tr key={order.id} className="group hover:bg-gray-50 transition-colors">
                          <td className="p-6 text-[11px] font-bold text-gray-900 tracking-tighter">{order.id}</td>
                          <td className="p-6 text-[10px] font-bold text-gray-700 uppercase tracking-tight">{customerLabel}</td>
                          <td className="p-6 text-[10px] font-bold text-gray-700 uppercase tracking-tight">{productLabel}</td>
                          <td className="p-6 text-[11px] font-bold text-gray-900 tracking-tighter">{formatTotals(order.totalsByCurrency)}</td>
                          <td className="p-6">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 text-[8px] font-bold uppercase tracking-widest border ${getStatusStyle(order.status)}`}>
                              {getStatusIcon(order.status)}
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                          <td className="p-6">
                            <button
                              onClick={() => setSelectedOrderId((prev) => (prev === order.id ? null : order.id))}
                              className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest transition ${isSelected ? 'text-blue-600' : 'text-gray-900 group-hover:text-blue-600'}`}
                            >
                              <FaEye size={10} />
                              {isSelected ? 'Close' : 'Manage'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {selectedOrder && (
                <div className="border-t border-gray-100 p-8 bg-white">
                  <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
                    <div>
                      <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2">Order Management</div>
                      <div className="text-xs font-bold text-gray-900 uppercase tracking-widest">{selectedOrder.id}</div>
                      <div className="text-[10px] font-medium text-gray-600 mt-1">
                        Customer: {selectedOrder.user?.name || selectedOrder.user?.email || 'Customer'}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 text-[9px] font-bold uppercase tracking-widest border ${getStatusStyle(selectedOrder.status)}`}>
                        {getStatusIcon(selectedOrder.status)}
                        {getStatusLabel(selectedOrder.status)}
                      </span>
                      <button
                        onClick={loadOrders}
                        className="px-6 h-10 border border-gray-200 text-gray-900 text-[9px] font-bold uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2">Set Next Status</div>
                          <select
                            value={orderNextStatus}
                            onChange={(e) => setOrderNextStatus(e.target.value)}
                            className="w-full h-12 border border-gray-200 px-4 text-[10px] font-bold uppercase tracking-widest outline-none bg-white focus:border-blue-600 transition"
                          >
                            <option value="">(No change)</option>
                            <option value="RECEIVED">Received</option>
                            <option value="UNDER_REVIEW">Under Review</option>
                            <option value="PACKAGING">Packaging</option>
                            <option value="OUT_FOR_DELIVERY">Out for delivery</option>
                          </select>
                        </div>

                        <div>
                          <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2">Packaging Time (minutes)</div>
                          <input
                            value={orderPackagingEtaMinutes}
                            onChange={(e) => setOrderPackagingEtaMinutes(e.target.value)}
                            placeholder="e.g. 60"
                            className="w-full h-12 border border-gray-200 px-4 text-[11px] font-semibold outline-none focus:border-blue-600"
                          />
                        </div>

                        <div>
                          <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2">Delivery Time (minutes)</div>
                          <input
                            value={orderDeliveryEtaMinutes}
                            onChange={(e) => setOrderDeliveryEtaMinutes(e.target.value)}
                            placeholder="e.g. 120"
                            className="w-full h-12 border border-gray-200 px-4 text-[11px] font-semibold outline-none focus:border-blue-600"
                          />
                        </div>

                        <div>
                          <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2">Transport Method</div>
                          <select
                            value={orderTransportMethod}
                            onChange={(e) => setOrderTransportMethod(e.target.value)}
                            className="w-full h-12 border border-gray-200 px-4 text-[10px] font-bold uppercase tracking-widest outline-none bg-white focus:border-blue-600 transition"
                          >
                            <option value="">(Not set)</option>
                            <option value="motor">Motor</option>
                            <option value="car">Car</option>
                            <option value="truck">Truck</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div>
                          <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2">Plate Number</div>
                          <input
                            value={orderTransportPlateNumber}
                            onChange={(e) => setOrderTransportPlateNumber(e.target.value)}
                            placeholder="e.g. RAB 123C"
                            className="w-full h-12 border border-gray-200 px-4 text-[11px] font-semibold outline-none focus:border-blue-600"
                          />
                        </div>
                      </div>

                      <div className="mt-8 flex gap-4">
                        <button
                          onClick={handleSaveOrderUpdate}
                          disabled={savingOrder}
                          className="px-8 h-12 bg-blue-600 disabled:opacity-60 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition"
                        >
                          {savingOrder ? 'Saving' : 'Save Update'}
                        </button>
                        <button
                          onClick={() => setSelectedOrderId(null)}
                          className="px-8 h-12 border border-gray-200 text-gray-900 text-[10px] font-bold uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition"
                        >
                          Close
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-4">Timeline</div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Ordered</span>
                          <span className="text-[10px] font-semibold text-gray-600">{formatOrderDateTime(selectedOrder.createdAt)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Received</span>
                          <span className="text-[10px] font-semibold text-gray-600">{formatOrderDateTime(selectedOrder.receivedAt)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Under review</span>
                          <span className="text-[10px] font-semibold text-gray-600">{formatOrderDateTime(selectedOrder.underReviewAt)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Packaging</span>
                          <span className="text-[10px] font-semibold text-gray-600">{formatOrderDateTime(selectedOrder.packagingAt)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Out</span>
                          <span className="text-[10px] font-semibold text-gray-600">{formatOrderDateTime(selectedOrder.outForDeliveryAt)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Delivered</span>
                          <span className="text-[10px] font-semibold text-gray-600">{formatOrderDateTime(selectedOrder.deliveredAt)}</span>
                        </div>
                      </div>

                      {(selectedOrder.transportMethod || selectedOrder.transportPlateNumber) && (
                        <div className="mt-8 border border-gray-100 p-4 bg-gray-50">
                          <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-3">Transport</div>
                          <div className="text-[11px] font-semibold text-gray-900">{selectedOrder.transportMethod || '—'}</div>
                          <div className="text-[11px] font-semibold text-gray-900">{selectedOrder.transportPlateNumber || '—'}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-12">
              <div className="flex justify-between items-end border-b border-gray-100 pb-8">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">Asset Inventory</h3>
                  <p className="text-[10px] text-gray-600 font-medium uppercase tracking-widest">Current stock distribution and valuation</p>
                </div>
                <button
                  onClick={() => {
                    if (showAddProduct) resetForm();
                    else setShowAddProduct(true);
                  }}
                  className="flex items-center gap-3 px-8 h-14 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-gray-200"
                >
                  <FaPlus size={10} />
                  {showAddProduct ? 'Cancel Form' : 'Initialize Listing'}
                </button>
              </div>

              {showAddProduct && (
                <div className="border border-gray-100 bg-gray-50/30">
                  <AdminProductForm
                    newProduct={newProduct}
                    onChange={handleNewProductChange}
                    imageFiles={imageFiles}
                    setImageFiles={setImageFiles}
                    isSubmitting={isSubmitting}
                    onSubmit={handleSubmitProduct}
                    categories={categories}
                    categoriesLoading={categoriesLoading}
                    newCategoryName={newCategoryName}
                    setNewCategoryName={setNewCategoryName}
                    isCreatingCategory={isCreatingCategory}
                    onCreateCategory={handleCreateCategory}
                    onCancel={resetForm}
                    onSizeChange={handleSizeChange}
                    isEditing={Boolean(editingProduct)}
                    existingImageUrls={editingProduct?.imageUrls}
                  />
                </div>
              )}

              <div className="border border-gray-100 p-8">
                <AdminProductsGrid
                  productsLoading={productsLoading}
                  products={adminProducts}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                />
              </div>
            </div>
          )}

          {/* Adverts Tab */}
          {activeTab === 'adverts' && (
            <div className="space-y-12">
              <div className="flex justify-between items-end border-b border-gray-100 pb-8">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">Adverts</h3>
                  <p className="text-[10px] text-gray-600 font-medium uppercase tracking-widest">Homepage advertising (image adverts only)</p>
                </div>
              </div>

              <div className="border border-gray-100 bg-white p-8">
                <form onSubmit={handleCreateAdvert} className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">Title</label>
                    <input
                      value={advertTitle}
                      onChange={(e) => setAdvertTitle(e.target.value)}
                      className="w-full h-12 border border-gray-200 px-4 text-[11px] font-semibold outline-none focus:border-blue-600"
                      placeholder="e.g. Summer Deals"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">Product Link</label>
                    <input
                      value={advertProductLink}
                      onChange={(e) => setAdvertProductLink(e.target.value)}
                      className="w-full h-12 border border-gray-200 px-4 text-[11px] font-semibold outline-none focus:border-blue-600"
                      placeholder="/product/abc123"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">Media Type</label>
                    <select
                      value={advertMediaType}
                      onChange={(e) => setAdvertMediaType(e.target.value as 'IMAGE' | 'VIDEO')}
                      className="w-full h-12 border border-gray-200 px-4 text-[11px] font-semibold outline-none focus:border-blue-600 bg-white"
                    >
                      <option value="IMAGE">Image</option>
                      <option value="VIDEO">Video</option>
                    </select>
                  </div>

                  {advertMediaType === 'IMAGE' ? (
                    <div className="md:col-span-8">
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">Advert Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setAdvertImageFile((e.target.files && e.target.files[0]) ? e.target.files[0] : null)}
                        className="w-full h-12 border border-gray-200 px-4 text-[11px] font-semibold outline-none focus:border-blue-600 bg-white pt-2"
                      />
                    </div>
                  ) : (
                    <div className="md:col-span-8">
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">Video URL</label>
                      <input
                        value={advertVideoUrl}
                        onChange={(e) => setAdvertVideoUrl(e.target.value)}
                        className="w-full h-12 border border-gray-200 px-4 text-[11px] font-semibold outline-none focus:border-blue-600"
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                    </div>
                  )}

                  <div className="md:col-span-4 flex items-end gap-3">
                    <button
                      type="submit"
                      disabled={savingAdvert}
                      className="w-full h-12 bg-blue-600 disabled:opacity-60 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition"
                    >
                      {savingAdvert ? 'Saving…' : 'Create Advert'}
                    </button>
                    <button
                      type="button"
                      onClick={resetAdvertForm}
                      className="h-12 px-6 border border-gray-200 text-gray-900 text-[10px] font-bold uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition"
                    >
                      Clear
                    </button>
                  </div>
                </form>
              </div>

              <div className="border border-gray-100 bg-white">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <div>
                    <h4 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-1">Existing Adverts</h4>
                    <p className="text-[10px] text-gray-600 font-medium uppercase tracking-widest">Toggle active to show/hide on homepage</p>
                  </div>
                  <button
                    onClick={() => loadAdvertsAdmin()}
                    className="px-6 h-10 border border-blue-600 text-blue-600 text-[9px] font-bold uppercase tracking-widest hover:bg-blue-600 hover:text-white transition"
                  >
                    Refresh
                  </button>
                </div>

                {advertsLoading && (
                  <div className="p-10 text-center text-[10px] font-bold text-gray-600 uppercase tracking-widest animate-pulse">Loading…</div>
                )}
                {!advertsLoading && advertsError && (
                  <div className="p-10 text-center text-[10px] font-bold text-red-600 uppercase tracking-widest">{advertsError}</div>
                )}
                {!advertsLoading && !advertsError && adverts.length === 0 && (
                  <div className="p-10 text-center text-[10px] font-bold text-gray-600 uppercase tracking-widest">No adverts yet</div>
                )}

                {!advertsLoading && !advertsError && adverts.length > 0 && (
                  <div className="divide-y divide-gray-100">
                    {adverts.map((ad) => (
                      <div key={ad.id} className="p-6 flex flex-col md:flex-row md:items-center gap-6">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-16 h-16 border border-gray-100 bg-white flex items-center justify-center overflow-hidden">
                            {ad.mediaType === 'IMAGE' ? (
                              <img
                                src={apiBaseUrl ? `${apiBaseUrl}/api/banners/${ad.id}/media` : (ad.imageUrl || mbiLogo)}
                                alt=""
                                className="w-full h-full object-contain"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = mbiLogo; }}
                              />
                            ) : (
                              <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Video</div>
                            )}
                          </div>
                          <div>
                            <div className="text-[11px] font-bold text-gray-900 uppercase tracking-widest">{ad.title}</div>
                            <div className="text-[10px] font-semibold text-gray-600">{ad.productLink}</div>
                            {ad.mediaType === 'VIDEO' && ad.videoUrl && (
                              <div className="text-[10px] font-semibold text-gray-500 truncate max-w-[520px]">{ad.videoUrl}</div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleAdvertActive(ad)}
                            className={`px-5 h-10 text-[9px] font-bold uppercase tracking-widest border transition ${ad.isActive
                              ? 'border-emerald-600 text-emerald-700 hover:bg-emerald-50'
                              : 'border-gray-200 text-gray-700 hover:border-blue-600 hover:text-blue-600'
                              }`}
                          >
                            {ad.isActive ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            onClick={() => handleDeleteAdvert(ad.id)}
                            className="px-5 h-10 text-[9px] font-bold uppercase tracking-widest border border-red-600 text-red-600 hover:bg-red-50 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Showroom Tab */}
          {activeTab === 'showroom' && (
            <div className="space-y-12">
              <div className="flex justify-between items-end border-b border-gray-100 pb-8">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">Showroom</h3>
                  <p className="text-[10px] text-gray-600 font-medium uppercase tracking-widest">Video-only showcase (public page)</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Navigation</div>
                    <div className="text-[10px] font-extrabold uppercase tracking-widest">
                      {uiConfigLoading ? (
                        <span className="text-gray-400">Loading…</span>
                      ) : uiConfig?.showroomHidden ? (
                        <span className="text-red-600">Hidden</span>
                      ) : (
                        <span className="text-emerald-600">Visible</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={savingUiConfig || uiConfigLoading}
                    onClick={() => updateUiConfig({ showroomHidden: !(uiConfig?.showroomHidden ?? true) })}
                    className={`px-6 h-10 text-[9px] font-bold uppercase tracking-widest border transition ${(uiConfig?.showroomHidden ?? true)
                      ? 'border-emerald-600 text-emerald-700 hover:bg-emerald-50'
                      : 'border-red-600 text-red-700 hover:bg-red-50'
                      } disabled:opacity-60`}
                  >
                    {savingUiConfig ? 'Saving…' : (uiConfig?.showroomHidden ?? true) ? 'Show in Navbar' : 'Hide in Navbar'}
                  </button>
                </div>
              </div>

              <div className="border border-gray-100 bg-white p-8">
                <form onSubmit={handleCreateShowroomVideo} className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">Title</label>
                    <input
                      value={showroomTitle}
                      onChange={(e) => setShowroomTitle(e.target.value)}
                      className="w-full h-12 border border-gray-200 px-4 text-[11px] font-semibold outline-none focus:border-blue-600"
                      placeholder="e.g. How to use"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">Product Link</label>
                    <input
                      value={showroomProductLink}
                      onChange={(e) => setShowroomProductLink(e.target.value)}
                      className="w-full h-12 border border-gray-200 px-4 text-[11px] font-semibold outline-none focus:border-blue-600"
                      placeholder="/product/abc123"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-2">Video URL</label>
                    <input
                      value={showroomVideoUrl}
                      onChange={(e) => setShowroomVideoUrl(e.target.value)}
                      className="w-full h-12 border border-gray-200 px-4 text-[11px] font-semibold outline-none focus:border-blue-600"
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>

                  <div className="md:col-span-12 flex gap-3">
                    <button
                      type="submit"
                      disabled={savingShowroom}
                      className="px-10 h-12 bg-blue-600 disabled:opacity-60 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition"
                    >
                      {savingShowroom ? 'Saving…' : 'Create Showroom Video'}
                    </button>
                    <button
                      type="button"
                      onClick={resetShowroomForm}
                      className="h-12 px-6 border border-gray-200 text-gray-900 text-[10px] font-bold uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition"
                    >
                      Clear
                    </button>
                  </div>
                </form>
              </div>

              <div className="border border-gray-100 bg-white">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <div>
                    <h4 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-1">Existing Showroom Videos</h4>
                    <p className="text-[10px] text-gray-600 font-medium uppercase tracking-widest">Toggle active to show/hide on showroom page</p>
                  </div>
                  <button
                    onClick={() => loadShowroomAdmin()}
                    className="px-6 h-10 border border-blue-600 text-blue-600 text-[9px] font-bold uppercase tracking-widest hover:bg-blue-600 hover:text-white transition"
                  >
                    Refresh
                  </button>
                </div>

                {showroomLoading && (
                  <div className="p-10 text-center text-[10px] font-bold text-gray-600 uppercase tracking-widest animate-pulse">Loading…</div>
                )}
                {!showroomLoading && showroomError && (
                  <div className="p-10 text-center text-[10px] font-bold text-red-600 uppercase tracking-widest">{showroomError}</div>
                )}
                {!showroomLoading && !showroomError && showroomVideos.length === 0 && (
                  <div className="p-10 text-center text-[10px] font-bold text-gray-600 uppercase tracking-widest">No videos yet</div>
                )}

                {!showroomLoading && !showroomError && showroomVideos.length > 0 && (
                  <div className="divide-y divide-gray-100">
                    {showroomVideos.map((v) => (
                      <div key={v.id} className="p-6 flex flex-col md:flex-row md:items-center gap-6">
                        <div className="flex-1">
                          <div className="text-[11px] font-bold text-gray-900 uppercase tracking-widest">{v.title}</div>
                          <div className="text-[10px] font-semibold text-gray-600">{v.productLink}</div>
                          <div className="text-[10px] font-semibold text-gray-500 truncate max-w-[720px]">{v.videoUrl}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleShowroomActive(v)}
                            className={`px-5 h-10 text-[9px] font-bold uppercase tracking-widest border transition ${v.isActive
                              ? 'border-emerald-600 text-emerald-700 hover:bg-emerald-50'
                              : 'border-gray-200 text-gray-700 hover:border-blue-600 hover:text-blue-600'
                              }`}
                          >
                            {v.isActive ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            onClick={() => handleDeleteShowroomVideo(v.id)}
                            className="px-5 h-10 text-[9px] font-bold uppercase tracking-widest border border-red-600 text-red-600 hover:bg-red-50 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="border border-gray-100 bg-white">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">Support Inbox</h3>
                  <p className="text-[10px] text-gray-600 font-medium uppercase tracking-widest">Open conversations with customers</p>
                </div>
                <button
                  onClick={() => loadConversations({ silent: false })}
                  className="px-8 h-12 border border-blue-600 text-blue-600 text-[9px] font-bold uppercase tracking-widest hover:bg-blue-600 hover:text-white transition"
                >
                  Refresh
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
                {/* Conversation list */}
                <div className="lg:col-span-4 border-r border-gray-100">
                  <div className="p-6 border-b border-gray-100">
                    <div className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Conversations</div>
                  </div>

                  {conversationsLoading && (
                    <div className="p-10 text-center">
                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em] animate-pulse">Loading...</span>
                    </div>
                  )}

                  {!conversationsLoading && conversationsError && (
                    <div className="p-10 text-center">
                      <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{conversationsError}</span>
                    </div>
                  )}

                  {!conversationsLoading && !conversationsError && conversations.length === 0 && (
                    <div className="p-10 text-center">
                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">No conversations</span>
                    </div>
                  )}

                  {!conversationsLoading && !conversationsError && conversations.map((c) => (
                    <button
                      key={c.userId}
                      onClick={() => handleSelectConversation(c.userId)}
                      className={`w-full text-left p-6 border-b border-gray-50 hover:bg-gray-50 transition ${selectedConversationUserId === c.userId ? 'bg-gray-50' : 'bg-white'}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-[11px] font-bold text-gray-900 tracking-tighter uppercase">{c.user?.name || 'Customer'}</div>
                          <div className="text-[10px] font-medium text-gray-600">{c.user?.email}</div>
                        </div>
                        {c.unreadCount > 0 && (
                          <div className="min-w-[24px] h-6 px-2 bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                            {c.unreadCount}
                          </div>
                        )}
                      </div>
                      <div className="mt-3 text-[10px] font-medium text-gray-700 line-clamp-2">{c.lastMessage}</div>
                      <div className="mt-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest">{new Date(c.lastAt).toLocaleString()}</div>
                    </button>
                  ))}
                </div>

                {/* Chat panel */}
                <div className="lg:col-span-8 flex flex-col">
                  {!selectedConversationUserId ? (
                    <div className="p-16 text-center">
                      <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Select a conversation to start</div>
                    </div>
                  ) : (
                    <>
                      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-bold text-gray-900 tracking-tighter uppercase">
                            {conversations.find((c) => c.userId === selectedConversationUserId)?.user?.name || 'Customer'}
                          </div>
                          <div className="text-[10px] font-medium text-gray-600">
                            {conversations.find((c) => c.userId === selectedConversationUserId)?.user?.email}
                          </div>
                        </div>
                        <button
                          onClick={() => selectedConversationUserId && handleSelectConversation(selectedConversationUserId)}
                          className="px-6 h-10 border border-gray-200 text-gray-900 text-[9px] font-bold uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition"
                        >
                          Reload
                        </button>
                      </div>

                      <div id="admin-support-chat-scroll" className="flex-1 p-6 bg-gray-50/30 overflow-y-auto">
                        {supportMessagesLoading && (
                          <div className="text-[10px] font-bold text-gray-600 uppercase tracking-widest animate-pulse">Loading messages...</div>
                        )}
                        {!supportMessagesLoading && supportMessagesError && (
                          <div className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{supportMessagesError}</div>
                        )}
                        {!supportMessagesLoading && !supportMessagesError && (
                          <div className="space-y-4">
                            {supportMessages.map((m) => (
                              <div key={m.id} className={`flex ${String(m.senderRole || 'CUSTOMER') === 'ADMIN' ? 'justify-end' : 'justify-start'}`}>
                                <div className={String(m.senderRole || 'CUSTOMER') === 'ADMIN'
                                  ? 'max-w-[85%] bg-blue-600 text-white rounded-2xl p-4'
                                  : 'max-w-[85%] bg-white border border-gray-100 rounded-2xl p-4'
                                }>
                                  <div className={String(m.senderRole || 'CUSTOMER') === 'ADMIN' ? 'text-[11px] font-semibold whitespace-pre-wrap' : 'text-[11px] font-semibold text-gray-900 whitespace-pre-wrap'}>
                                    {m.message}
                                  </div>
                                  <div className={String(m.senderRole || 'CUSTOMER') === 'ADMIN' ? 'mt-2 text-[9px] font-bold uppercase tracking-widest text-white/80' : 'mt-2 text-[9px] font-bold uppercase tracking-widest text-gray-500'}>
                                    {new Date(m.createdAt).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="p-6 border-t border-gray-100 bg-white">
                        <form onSubmit={handleSendReply} className="flex gap-4">
                          <input
                            value={replyDraft}
                            onChange={(e) => setReplyDraft(e.target.value)}
                            placeholder="Type a reply..."
                            className="flex-1 h-12 px-4 border border-gray-200 text-[11px] font-semibold outline-none focus:border-blue-600"
                          />
                          <button
                            type="submit"
                            disabled={sendingReply}
                            className="px-8 h-12 bg-blue-600 disabled:opacity-60 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition"
                          >
                            {sendingReply ? 'Sending' : 'Send'}
                          </button>
                        </form>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div className="border border-gray-100">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1">Entity Registry</h3>
                  <p className="text-[10px] text-gray-600 font-medium uppercase tracking-widest">Verified customer database</p>
                </div>
                <button className="px-8 h-12 border border-blue-600 text-blue-600 text-[9px] font-bold uppercase tracking-widest hover:bg-blue-600 hover:text-white transition">Full Export</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white">
                      <th className="p-6 text-[9px] font-bold text-gray-600 uppercase tracking-widest">Identity</th>
                      <th className="p-6 text-[9px] font-bold text-gray-600 uppercase tracking-widest">Communication Channel</th>
                      <th className="p-6 text-[9px] font-bold text-gray-600 uppercase tracking-widest">Activity Count</th>
                      <th className="p-6 text-[9px] font-bold text-gray-600 uppercase tracking-widest">Net Valuation</th>
                      <th className="p-6 text-[9px] font-bold text-gray-600 uppercase tracking-widest">Verification Date</th>
                      <th className="p-6 text-[9px] font-bold text-gray-600 uppercase tracking-widest">Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                    {customersLoading && (
                      <tr>
                        <td colSpan={6} className="p-20 text-center">
                          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em] animate-pulse">Accessing Registry...</span>
                        </td>
                      </tr>
                    )}
                    {!customersLoading && customersError && (
                      <tr>
                        <td colSpan={6} className="p-20 text-center">
                          <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">{customersError}</span>
                        </td>
                      </tr>
                    )}
                    {!customersLoading && !customersError && customers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-20 text-center">
                          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Registry Empty</span>
                        </td>
                      </tr>
                    )}
                    {!customersLoading && !customersError && customers.map((customer) => (
                      (() => {
                        const metrics = customerOrderMetrics.get(customer.id) ?? { orderCount: 0, totalsByCurrency: {} };
                        const activityLabel = `${metrics.orderCount} ORDERS`;
                        const valuationLabel = formatTotals(metrics.totalsByCurrency);
                        return (
                          <tr key={customer.id} className="group hover:bg-gray-50 transition-colors">
                            <td className="p-6">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center rounded-sm">
                                  {customer.name?.charAt(0) || customer.email.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-[11px] font-bold text-gray-900 tracking-tighter uppercase">{customer.name || 'Anonymous Entity'}</span>
                              </div>
                            </td>
                            <td className="p-6 text-[10px] font-medium text-gray-700">{customer.email}</td>
                            <td className="p-6 text-[11px] font-bold text-gray-900 tracking-tighter">{activityLabel}</td>
                            <td className="p-6 text-[11px] font-bold text-gray-900 tracking-tighter">{valuationLabel}</td>
                            <td className="p-6 text-[10px] font-bold text-gray-600 tracking-widest uppercase">{formatJoinDate(customer.createdAt)}</td>
                            <td className="p-6">
                              <button className="text-[9px] font-bold uppercase tracking-widest text-gray-900 group-hover:text-blue-600 transition">Profile Access</button>
                            </td>
                          </tr>
                        );
                      })()
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;