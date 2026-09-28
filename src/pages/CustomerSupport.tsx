import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaEnvelope, FaWhatsapp, FaHeadset, FaClock, FaCheck, FaCheckDouble } from 'react-icons/fa';
import { FiSend } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type SupportMessage = {
  id: string;
  message: string;
  createdAt: string;
  readAt?: string | null;
  senderRole?: 'CUSTOMER' | 'ADMIN' | string;
};

const CustomerSupport = () => {
  const supportEmail = 'info@mbitechnova.com';
  const whatsappNumber = '+250791689396';
  const whatsappLink = 'https://wa.me/250791689396';

  const { token, isAuthenticated, logout } = useAuth();
  const apiBaseUrl = useMemo(() => (process.env.REACT_APP_API_URL ?? '').replace(/\/$/, ''), []);

  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const lastSignatureRef = useRef('');

  const computeSignature = useCallback((list: SupportMessage[]) => {
    const last = list[list.length - 1];
    const lastCustomer = [...list].reverse().find((m) => String(m.senderRole || 'CUSTOMER') !== 'ADMIN');
    return `${list.length}:${last?.id ?? ''}:${last?.createdAt ?? ''}:${lastCustomer?.readAt ?? ''}`;
  }, []);

  const loadMyMessages = useCallback(async (opts?: { silent?: boolean }) => {
    if (!apiBaseUrl || !token) return;
    const silent = Boolean(opts?.silent);
    if (!silent) setMessagesLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/support/messages/me`, {
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
      const serverMessages = (data?.messages ?? []) as SupportMessage[];
      const signature = computeSignature(serverMessages);
      if (signature !== lastSignatureRef.current) {
        lastSignatureRef.current = signature;
        setMessages(serverMessages);
      }
    } catch (err: any) {
      if (!silent) toast.error(err?.message || 'Failed to load messages');
    } finally {
      if (!silent) setMessagesLoading(false);
    }
  }, [apiBaseUrl, token, computeSignature, logout]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadMyMessages({ silent: false });
  }, [isAuthenticated, loadMyMessages]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!apiBaseUrl || !token) return;

    const id = window.setInterval(() => {
      loadMyMessages({ silent: true });
    }, 4000);

    return () => window.clearInterval(id);
  }, [isAuthenticated, apiBaseUrl, token, loadMyMessages]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const el = document.getElementById('support-chat-scroll');
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [isAuthenticated, messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !token) {
      toast.error('Please log in to send a message');
      return;
    }
    if (!apiBaseUrl) {
      toast.error('Missing API configuration');
      return;
    }

    const msg = draft.trim();
    if (!msg) {
      toast.error('Please type a message');
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/support/messages`, {
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

      setDraft('');
      const created = data?.message as SupportMessage | undefined;
      if (created?.id) {
        setMessages((prev) => {
          const next = [...prev, created];
          lastSignatureRef.current = computeSignature(next);
          return next;
        });
      } else {
        await loadMyMessages({ silent: true });
      }
      toast.success('Message sent successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 selection:bg-blue-600 selection:text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">Customer Support</h1>
          <p className="text-slate-600 max-w-md mx-auto">
            Get help from our support team. We're here 24/7 to assist you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Chat Section */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Live Chat</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {isAuthenticated
                      ? 'Send a message and our team will respond shortly'
                      : 'You can view this page without login. Login is only required to send messages.'}
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold whitespace-nowrap">
                  <span className="inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                  Live
                </div>
              </div>

              <div className="p-6">
                {/* Messages Container */}
                <div
                  id="support-chat-scroll"
                  className="bg-slate-50 rounded-lg p-4 h-[400px] overflow-y-auto mb-4 border border-slate-100"
                >
                  {!isAuthenticated ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                        <FaHeadset className="text-blue-600" size={20} />
                      </div>
                      <p className="text-slate-700 text-sm font-semibold">Login to start chatting</p>
                      <p className="text-slate-600 text-xs mt-1 max-w-sm">
                        You can still contact us using Email or WhatsApp on the right.
                      </p>
                    </div>
                  ) : messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-slate-600">Loading messages...</div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mb-3">
                        <FaHeadset className="text-slate-500" size={20} />
                      </div>
                      <p className="text-slate-600 text-sm">No messages yet</p>
                      <p className="text-slate-500 text-xs mt-1">Send a message to start the conversation</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((m) => {
                        const isAdmin = String(m.senderRole || 'CUSTOMER') === 'ADMIN';
                        return (
                          <div
                            key={m.id}
                            className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}
                          >
                            <div
                              className={`max-w-[80%] ${isAdmin
                                ? 'bg-white border border-slate-200'
                                : 'bg-blue-600 text-white'
                                } rounded-2xl px-4 py-3 shadow-sm`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-medium ${isAdmin ? 'text-slate-600' : 'text-white/80'}`}>
                                  {isAdmin ? 'Support Team' : 'You'}
                                </span>
                                <span className={`text-[10px] ${isAdmin ? 'text-slate-500' : 'text-white/70'}`}>
                                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className={`text-sm ${isAdmin ? 'text-slate-800' : 'text-white'} whitespace-pre-wrap`}>
                                {m.message}
                              </p>
                              {!isAdmin && (
                                <div className="flex justify-end mt-1">
                                  {m.readAt ? (
                                    <FaCheckDouble className="text-blue-400" size={12} />
                                  ) : (
                                    <FaCheck className="text-white/70" size={12} />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSend} className="space-y-3">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={3}
                    placeholder={isAuthenticated ? 'Type your message here...' : 'Type your message (login required to send)'}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:border-blue-600 focus:outline-none transition-colors resize-none"
                  />

                  {isAuthenticated ? (
                    <button
                      type="submit"
                      disabled={sending || !draft.trim()}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <FiSend size={16} />
                          Send Message
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      state={{ from: { pathname: '/support' } }}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors no-underline"
                    >
                      Sign In to Send Message
                    </Link>
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* Contact Info Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Contact Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Quick Contact</h3>
              </div>
              <div className="p-6 space-y-4">
                <a
                  href={`mailto:${supportEmail}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors no-underline group"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FaEnvelope className="text-slate-600 group-hover:text-white" size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-600">Email</div>
                    <div className="text-sm font-semibold text-slate-900">{supportEmail}</div>
                  </div>
                </a>

                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors no-underline group"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors">
                    <FaWhatsapp className="text-slate-600 group-hover:text-white" size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-600">WhatsApp</div>
                    <div className="text-sm font-semibold text-slate-900">{whatsappNumber}</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Support Hours Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Support Hours</h3>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <FaClock className="text-slate-400" size={16} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Monday - Friday</div>
                    <div className="text-xs text-slate-600">9:00 AM - 6:00 PM</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FaClock className="text-slate-400" size={16} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Saturday</div>
                    <div className="text-xs text-slate-600">10:00 AM - 4:00 PM</div>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-600">Average response time: &lt; 2 hours</div>
                </div>
              </div>
            </div>

            {/* FAQ Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Quick Answers</h3>
              </div>
              <div className="p-6 space-y-3">
                <Link to="/faq" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  • How to track my order?
                </Link>
                <Link to="/faq" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  • What's your return policy?
                </Link>
                <Link to="/faq" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  • How to change my password?
                </Link>
                <Link to="/faq" className="block text-sm text-slate-600 hover:text-blue-600 transition-colors">
                  • Payment methods accepted?
                </Link>
                <div className="pt-3">
                  <Link to="/faq" className="text-sm font-medium text-slate-900 hover:text-blue-600 hover:underline">
                    View all FAQs →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSupport;