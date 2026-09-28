import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaSearch, FaShippingFast, FaCheckCircle, FaTruck, FaBox } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

type OrderItem = {
  productId: string;
  name: string;
  size: string;
  quantity: number;
  price: number;
  currency: string;
};

type ApiOrder = {
  id: string;
  status: 'ORDERED' | 'RECEIVED' | 'UNDER_REVIEW' | 'PACKAGING' | 'PROCESSING' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | string;
  items: OrderItem[];
  totalsByCurrency: Record<string, number>;
  createdAt: string;
  updatedAt?: string;
  receivedAt?: string | null;
  underReviewAt?: string | null;
  packagingAt?: string | null;
  outForDeliveryAt?: string | null;
  deliveredAt?: string | null;
  packagingEtaMinutes?: number | null;
  deliveryEtaMinutes?: number | null;
  transportMethod?: string | null;
  transportPlateNumber?: string | null;
};

const OrderTracking = () => {
  const location = useLocation();
  const { token, isAuthenticated, logout } = useAuth();
  const apiBaseUrl = useMemo(() => (process.env.REACT_APP_API_URL ?? '').replace(/\/$/, ''), []);

  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [markingDeliveredId, setMarkingDeliveredId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated || !token) {
        setOrders([]);
        return;
      }
      if (!apiBaseUrl) {
        setLoadError('Missing REACT_APP_API_URL');
        return;
      }

      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`${apiBaseUrl}/api/orders/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          logout('expired');
          return;
        }
        const data: any = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error || 'Failed to load orders');
        }
        setOrders(data?.orders ?? []);
      } catch (err: any) {
        const msg = err?.message || 'Failed to load orders';
        setLoadError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [apiBaseUrl, isAuthenticated, token, location.state, logout]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = orders.filter((order: any) =>
        String(order.id).toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [orders, searchTerm]);

  const formatAmount = (amount: number, currency?: string) => {
    const n = Number(amount || 0);
    const formatted = n.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
    return currency ? `${formatted} ${currency}` : formatted;
  };

  const normalizeStatus = (status: any) => String(status || '').toUpperCase();

  const getStatusIcon = (status: any) => {
    const s = normalizeStatus(status);
    if (s === 'DELIVERED') return <FaCheckCircle />;
    if (s === 'OUT_FOR_DELIVERY' || s === 'SHIPPED') return <FaTruck />;
    if (s === 'PACKAGING' || s === 'UNDER_REVIEW' || s === 'RECEIVED' || s === 'PROCESSING') return <FaShippingFast />;
    return <FaBox />;
  };

  const getStatusText = (status: any) => {
    const s = normalizeStatus(status);
    if (s === 'ORDERED') return 'Order Placed';
    if (s === 'RECEIVED') return 'Order Received';
    if (s === 'UNDER_REVIEW') return 'Under Review';
    if (s === 'PACKAGING') return 'Packaging';
    if (s === 'PROCESSING') return 'Processing';
    if (s === 'OUT_FOR_DELIVERY') return 'On the way';
    if (s === 'SHIPPED') return 'Shipped';
    if (s === 'DELIVERED') return 'Delivered';
    return 'Unknown';
  };

  const getStatusTheme = (status: any) => {
    const s = normalizeStatus(status);
    if (s === 'DELIVERED') return { badge: 'bg-emerald-100 text-emerald-600', icon: 'bg-emerald-500' };
    if (s === 'OUT_FOR_DELIVERY' || s === 'SHIPPED') return { badge: 'bg-purple-100 text-purple-600', icon: 'bg-purple-500' };
    if (s === 'PACKAGING') return { badge: 'bg-cyan-100 text-cyan-600', icon: 'bg-cyan-500' };
    if (s === 'UNDER_REVIEW' || s === 'RECEIVED' || s === 'PROCESSING') return { badge: 'bg-blue-100 text-blue-600', icon: 'bg-blue-500' };
    if (s === 'ORDERED') return { badge: 'bg-amber-100 text-amber-600', icon: 'bg-amber-500' };
    return { badge: 'bg-slate-100 text-slate-600', icon: 'bg-slate-500' };
  };

  const formatOrderDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  };

  const formatTotals = (totalsByCurrency: Record<string, number>) => {
    const entries = Object.entries(totalsByCurrency ?? {}).filter(([, v]) => Number(v || 0) !== 0);
    if (entries.length === 0) return '—';
    entries.sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([cur, amt]) => formatAmount(amt, cur)).join(' · ');
  };

  const buildTimeline = (order: ApiOrder) => {
    const parse = (iso?: string | null) => {
      if (!iso) return null;
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return null;
      return d;
    };

    const current = normalizeStatus(order.status);
    const fallback = parse(order.updatedAt) ?? parse(order.createdAt);

    const events: Array<{ key: string; label: string; ts: Date | null; description: string }> = [];

    const orderedTs = parse(order.createdAt);
    events.push({ key: 'ORDERED', label: 'Order placed', ts: orderedTs, description: 'Order placed successfully' });

    const receivedTs = parse(order.receivedAt) ?? ((['RECEIVED', 'UNDER_REVIEW', 'PACKAGING', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(current)) ? fallback : null);
    if (receivedTs) events.push({ key: 'RECEIVED', label: 'Received', ts: receivedTs, description: 'Order received and queued' });

    const reviewTs = parse(order.underReviewAt) ?? ((['UNDER_REVIEW', 'PACKAGING', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(current)) ? fallback : null);
    if (reviewTs) events.push({ key: 'UNDER_REVIEW', label: 'Under review', ts: reviewTs, description: 'Order under review' });

    const packagingTs = parse(order.packagingAt) ?? ((['PACKAGING', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(current)) ? fallback : null);
    if (packagingTs) {
      const eta = order.packagingEtaMinutes != null ? ` (packaging ~${order.packagingEtaMinutes} min)` : '';
      events.push({ key: 'PACKAGING', label: 'Packaging', ts: packagingTs, description: `Order is being packaged${eta}` });
    }

    const outTs = parse(order.outForDeliveryAt) ?? ((['OUT_FOR_DELIVERY', 'SHIPPED', 'DELIVERED'].includes(current)) ? fallback : null);
    if (outTs) {
      const eta = order.deliveryEtaMinutes != null ? ` (delivery ~${order.deliveryEtaMinutes} min)` : '';
      const transport = (order.transportMethod || order.transportPlateNumber)
        ? ` — ${String(order.transportMethod || '').toUpperCase()} ${order.transportPlateNumber || ''}`.trim()
        : '';
      events.push({ key: 'OUT_FOR_DELIVERY', label: 'On the way', ts: outTs, description: `Order is on the way${eta}${transport}` });
    }

    const deliveredTs = parse(order.deliveredAt) ?? (current === 'DELIVERED' ? fallback : null);
    if (deliveredTs) events.push({ key: 'DELIVERED', label: 'Delivered', ts: deliveredTs, description: 'Order delivered successfully' });

    return events
      .filter((e) => e.ts)
      .map((e) => ({
        status: e.key,
        date: (e.ts as Date).toISOString().slice(0, 10),
        time: (e.ts as Date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        description: e.description,
      }));
  };

  const handleMarkDelivered = async (orderId: string) => {
    if (!apiBaseUrl || !token) {
      toast.error('Missing configuration or session');
      return;
    }
    setMarkingDeliveredId(orderId);
    try {
      const res = await fetch(`${apiBaseUrl}/api/orders/${orderId}/delivered`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        logout('expired');
        return;
      }
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to mark delivered');
      }
      const updated = data?.order as ApiOrder;
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      toast.success('Marked as delivered');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to mark delivered');
    } finally {
      setMarkingDeliveredId(null);
    }
  };

  return (
    <div className="py-6 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 text-center mb-6">
          Order Tracking
        </h1>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="relative flex items-center">
            <FaSearch className="absolute left-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by order ID or tracking number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Orders List */}
        {!isAuthenticated ? (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-100 p-6 text-center text-slate-600">
            Please login to view your saved orders.
          </div>
        ) : loading ? (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-100 p-6 text-center text-slate-600">
            Loading orders...
          </div>
        ) : loadError ? (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-100 p-6 text-center text-red-600">
            {loadError}
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="max-w-4xl mx-auto space-y-5">
            {filteredOrders.map((order) => {
              const status = normalizeStatus((order as any)?.status ?? 'ORDERED');
              const theme = getStatusTheme(status);
              const anyOrder: any = order as any;
              const showShippingInfo = Boolean(anyOrder?.shippingAddress || anyOrder?.trackingNumber || anyOrder?.estimatedDelivery || anyOrder?.actualDelivery);
              const timeline = buildTimeline(order);
              const canMarkDelivered = status === 'OUT_FOR_DELIVERY' || status === 'SHIPPED';
              return (
                <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5 overflow-hidden">
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 mb-4 gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-0.5">
                        Order #{order.id}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Placed on {formatOrderDate((order as any).createdAt)}
                      </p>
                    </div>
                    <div className="text-left sm:text-right flex flex-col items-start sm:items-end w-full sm:w-auto">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-1.5 ${theme.badge}`}>
                        {getStatusIcon(status)}
                        {getStatusText(status)}
                      </div>
                      <div className="text-sm font-bold text-blue-600">
                        {formatTotals((order as any).totalsByCurrency)}
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-5">
                    <h4 className="font-semibold text-slate-800 mb-3 text-sm">Items Ordered</h4>
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 text-sm truncate">{item.name}</div>
                            <div className="text-slate-500 text-xs">
                              {item.size ? `Size ${item.size} · ` : ''}Qty {item.quantity}
                            </div>
                          </div>
                          <div className="shrink-0 font-semibold text-blue-600 text-sm">
                            {formatAmount(item.price * item.quantity, item.currency)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Info */}
                  {showShippingInfo && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-1.5 text-sm">Shipping Address</h4>
                        <p className="text-slate-600 text-xs leading-relaxed max-w-[260px]">{anyOrder.shippingAddress}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-1.5 text-sm">Tracking Info</h4>
                        <p className="text-slate-600 text-xs mb-1">
                          Tracking #: <strong className="text-slate-800 tracking-wide">{anyOrder.trackingNumber}</strong>
                        </p>
                        <p className="text-slate-600 text-xs">
                          {status === 'DELIVERED'
                            ? `Delivered: ${anyOrder.actualDelivery}`
                            : `Est. Delivery: ${anyOrder.estimatedDelivery}`
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Delivery / transport details */}
                  {(order.packagingEtaMinutes != null || order.deliveryEtaMinutes != null || order.transportMethod || order.transportPlateNumber) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-1.5 text-sm">Estimated Times</h4>
                        <p className="text-slate-600 text-xs mb-1">
                          Packaging: <strong className="text-slate-800">{order.packagingEtaMinutes != null ? `${order.packagingEtaMinutes} min` : '—'}</strong>
                        </p>
                        <p className="text-slate-600 text-xs">
                          Delivery: <strong className="text-slate-800">{order.deliveryEtaMinutes != null ? `${order.deliveryEtaMinutes} min` : '—'}</strong>
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-1.5 text-sm">Transportation</h4>
                        <p className="text-slate-600 text-xs mb-1">
                          Method: <strong className="text-slate-800">{order.transportMethod ? String(order.transportMethod).toUpperCase() : '—'}</strong>
                        </p>
                        <p className="text-slate-600 text-xs">
                          Plate #: <strong className="text-slate-800">{order.transportPlateNumber || '—'}</strong>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Order Timeline */}
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-4 text-sm">Order Timeline</h4>
                    <div className="relative pl-2">
                      {timeline.map((event, index) => (
                        <div key={index} className="flex items-start mb-4 relative">
                          {/* Timeline Line */}
                          {index < timeline.length - 1 && (
                            <div className="absolute left-[13px] top-7 w-0.5 h-[calc(100%-8px)] bg-slate-200" />
                          )}

                          {/* Status Icon */}
                          <div className={`w-7 h-7 rounded-full ${getStatusTheme(event.status).icon} flex items-center justify-center text-white mr-3 shadow-sm flex-shrink-0 z-10`}>
                            {getStatusIcon(event.status)}
                          </div>

                          {/* Event Details */}
                          <div className="flex-1 pt-1">
                            <div className="font-semibold text-slate-800 mb-0.5 text-sm">
                              {event.description}
                            </div>
                            <div className="text-xs text-slate-500">
                              {event.date} at {event.time}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-100 sm:justify-end">
                    {canMarkDelivered && (
                      <button
                        disabled={markingDeliveredId === order.id}
                        onClick={() => handleMarkDelivered(order.id)}
                        className="px-4 py-2 rounded-lg bg-blue-600 disabled:opacity-60 text-white font-medium hover:bg-blue-700 shadow-sm shadow-blue-200 transition-colors text-sm flex-1 sm:flex-none text-center"
                      >
                        {markingDeliveredId === order.id ? 'Marking...' : 'Mark as Delivered'}
                      </button>
                    )}
                    <button className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors text-sm flex-1 sm:flex-none text-center">
                      Contact Support
                    </button>
                    {status === 'DELIVERED' && (
                      <button className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-sm shadow-blue-200 transition-colors text-sm flex-1 sm:flex-none text-center">
                        Leave Review
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 px-5 max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100">
            {searchTerm ? (
              <>
                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaSearch className="text-2xl text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No orders found</h3>
                <p className="text-slate-500 mb-5 text-sm max-w-md mx-auto">
                  No orders match your search criteria. Please check your order ID or tracking number.
                </p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-5 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors inline-block text-sm"
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaBox className="text-3xl text-slate-200" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No orders yet</h3>
                <p className="text-slate-500 mb-5 text-sm max-w-md mx-auto">
                  You haven't placed any orders yet. Start shopping to track your purchases here.
                </p>
                <button
                  onClick={() => window.location.href = '/products'}
                  className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-sm shadow-blue-200 transition-colors inline-block text-sm"
                >
                  Start Shopping
                </button>
              </>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className=" mx-auto mt-8 bg-white rounded-xl shadow-sm border border-slate-100 p-5 sm:p-6 mb-8">
          <h3 className="text-xl font-bold text-slate-800 text-center mb-6">Need Help with Your Order?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="text-center group">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                <FaSearch className="text-2xl text-blue-600" />
              </div>
              <h4 className="text-base font-semibold text-slate-800 mb-1">Track Your Package</h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-[250px] mx-auto">
                Use your tracking number to get real-time updates
              </p>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                <FaCheckCircle className="text-2xl text-blue-600" />
              </div>
              <h4 className="text-base font-semibold text-slate-800 mb-1">Contact Support</h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-[250px] mx-auto">
                Get help with any order-related questions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;