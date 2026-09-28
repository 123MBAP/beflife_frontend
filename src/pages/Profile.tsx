import React, { useEffect, useMemo, useState } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaEdit, FaSave, FaTimes, FaHeadset, FaSignOutAlt, FaLock, FaCalendarAlt, FaTruck } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

type MeUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role?: string;
  createdAt?: string;
};

type MyOrder = {
  id: string;
  status: string;
  createdAt: string;
  totalsByCurrency?: Record<string, number>;
  items?: any;
};

const Profile = () => {
  const { user, token, logout, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const apiBaseUrl = useMemo(() => (process.env.REACT_APP_API_URL ?? '').replace(/\/$/, ''), []);

  const authName = user?.name ?? '';
  const authEmail = user?.email ?? '';
  const authPhone = ((user as any)?.phone as string | undefined) ?? '';

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profile, setProfile] = useState<MeUser | null>(null);

  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orders, setOrders] = useState<MyOrder[]>([]);

  const [formData, setFormData] = useState({
    name: authName,
    email: authEmail,
    phone: authPhone,
  });

  useEffect(() => {
    // Keep form fields in sync with auth state
    setFormData({
      name: authName,
      email: authEmail,
      phone: authPhone,
    });
  }, [authName, authEmail, authPhone]);

  useEffect(() => {
    const loadMe = async () => {
      if (!apiBaseUrl || !token) return;
      setLoadingProfile(true);
      try {
        const res = await fetch(`${apiBaseUrl}/api/users/me`, {
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
          throw new Error(data?.error || 'Failed to load profile');
        }
        const u = data?.user as MeUser;
        setProfile(u);
        setFormData({
          name: u?.name ?? '',
          email: u?.email ?? '',
          phone: u?.phone ?? '',
        });

        // Keep AuthContext in sync
        const nextUserForUi = {
          ...(user ?? {}),
          id: u.id,
          email: u.email,
          name: u.name,
          phone: u.phone,
          role: u.role,
          isAdmin: u.role === 'ADMIN',
        };
        setUser(nextUserForUi);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load profile');
      } finally {
        setLoadingProfile(false);
      }
    };

    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBaseUrl, token]);

  useEffect(() => {
    const loadOrders = async () => {
      if (!apiBaseUrl || !token) return;
      setOrdersLoading(true);
      try {
        const res = await fetch(`${apiBaseUrl}/api/orders/my`, {
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
          throw new Error(data?.error || 'Failed to load orders');
        }
        setOrders(Array.isArray(data?.orders) ? data.orders : []);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load orders');
      } finally {
        setOrdersLoading(false);
      }
    };
    loadOrders();
  }, [apiBaseUrl, token, logout]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatOrderTotals = (totalsByCurrency?: Record<string, number>) => {
    const entries = Object.entries(totalsByCurrency ?? {});
    if (entries.length === 0) return '—';
    if (entries.length === 1) {
      const [cur, amt] = entries[0];
      return `${Number(amt || 0).toLocaleString()} ${cur}`;
    }
    return entries
      .map(([cur, amt]) => `${Number(amt || 0).toLocaleString()} ${cur}`)
      .join(' + ');
  };

  const handleSave = async () => {
    if (!apiBaseUrl || !token) {
      toast.error('Missing configuration or session');
      return;
    }

    const payload: any = {
      name: formData.name,
      phone: formData.phone,
    };

    setSavingProfile(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/users/me`, {
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
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to update profile');
      }

      const u = data?.user as MeUser;
      setProfile(u);
      setFormData({
        name: u?.name ?? '',
        email: u?.email ?? formData.email,
        phone: u?.phone ?? '',
      });

      const nextUserForUi = {
        ...(user ?? {}),
        id: u.id,
        email: u.email,
        name: u.name,
        phone: u.phone,
        role: u.role,
        isAdmin: u.role === 'ADMIN',
      };
      setUser(nextUserForUi);

      toast.success('Profile updated');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name ?? user?.name ?? '',
      email: profile?.email ?? user?.email ?? '',
      phone: profile?.phone ?? (user as any)?.phone ?? '',
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      toast.success('Logged out successfully');
    }
  };

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-500 mt-1">Manage your profile and view your orders</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Profile & Orders */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <FaEdit size={14} />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={savingProfile}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <FaSave size={14} />
                      {savingProfile ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={savingProfile}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <FaTimes size={14} />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6">
                {loadingProfile && (
                  <div className="text-sm text-gray-500 font-medium">Loading profile…</div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaUser className="inline mr-2 text-gray-400" size={14} />
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-gray-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaEnvelope className="inline mr-2 text-gray-400" size={14} />
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-gray-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaPhone className="inline mr-2 text-gray-400" size={14} />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-gray-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
                <Link to="/orders" className="text-sm font-medium text-gray-700 hover:text-black no-underline">
                  View all
                </Link>
              </div>

              <div className="p-6">
                {ordersLoading && (
                  <div className="text-sm text-gray-500 font-medium">Loading orders…</div>
                )}

                {!ordersLoading && recentOrders.length === 0 && (
                  <div className="text-sm text-gray-500 font-medium">No orders yet.</div>
                )}

                {!ordersLoading && recentOrders.length > 0 && (
                  <div className="space-y-3">
                    {recentOrders.map((o) => (
                      <div key={o.id} className="border border-gray-100 rounded-lg p-4 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <FaCalendarAlt size={14} className="text-gray-400" />
                            <span className="text-sm font-semibold text-gray-900">
                              {new Date(o.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 font-medium truncate">Order #{o.id}</div>
                          <div className="mt-2 text-sm font-semibold text-gray-900">
                            {formatOrderTotals(o.totalsByCurrency)}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                            <FaTruck size={12} />
                            {String(o.status || '').replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Account Actions */}
          <div className="space-y-6">
            {/* Account Actions Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Account Actions</h3>
              </div>

              <div className="p-4 space-y-2">
                <Link to="/forgot-password" className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors no-underline">
                  <FaLock size={16} className="text-gray-400" />
                  Reset Password
                </Link>

                <hr className="my-2 border-gray-100" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <FaSignOutAlt size={16} />
                  Logout
                </button>
              </div>
            </div>

            {/* Account Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h4 className="font-semibold text-gray-900">Account Information</h4>
              </div>

              <div className="p-6 space-y-3 text-sm">

                <div className="flex justify-between">
                  <span className="text-gray-500">Account type:</span>
                  <span className="font-medium text-gray-900">
                    {user?.isAdmin ? 'Administrator' : 'Customer'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total orders:</span>
                  <span className="font-medium text-gray-900">{orders.length}</span>
                </div>

              </div>
            </div>

            {/* Support Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-sm overflow-hidden text-white">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <FaHeadset size={20} />
                  </div>
                  <h4 className="font-semibold">Need Help?</h4>
                </div>

                <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                  Our customer support team is here to help you with any questions or concerns.
                </p>

                <Link to="/support" className="flex justify-center w-full mb-3 px-4 py-2.5 text-sm font-medium bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
                  Contact Support
                </Link>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;