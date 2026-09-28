import React from 'react';
import { Link } from 'react-router-dom';

export default function TermsAndConditions() {
    return (
        <div className="w-full bg-slate-50">
            <div className="max-w-5xl mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-8 sm:p-10">
                    <div className="flex items-start justify-between gap-6 flex-wrap">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Terms &amp; Conditions</h1>
                            <p className="text-slate-600 mt-2 text-sm">
                                Please read these Terms &amp; Conditions carefully before using our website or placing an order.
                            </p>
                        </div>
                        <div className="text-xs text-slate-500">
                            Last updated: {new Date().toISOString().slice(0, 10)}
                        </div>
                    </div>

                    <div className="mt-8 space-y-8 text-sm text-slate-700 leading-relaxed">
                        <section>
                            <h2 className="text-base font-semibold text-slate-900">1) Acceptance of Terms</h2>
                            <p className="mt-2">
                                By accessing or using this website, creating an account, or placing an order, you agree to be bound by
                                these Terms &amp; Conditions. If you do not agree, please do not use the website.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-base font-semibold text-slate-900">2) Accounts &amp; Customer Information</h2>
                            <ul className="mt-2 list-disc pl-5 space-y-2">
                                <li>You are responsible for providing accurate contact and delivery information.</li>
                                <li>You are responsible for maintaining the confidentiality of your account and password.</li>
                                <li>We may suspend accounts that are used for fraud, abuse, or unlawful activity.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-base font-semibold text-slate-900">3) Orders, Pricing &amp; Payment</h2>
                            <ul className="mt-2 list-disc pl-5 space-y-2">
                                <li>All prices are shown on the product pages and may change without prior notice.</li>
                                <li>We may refuse or cancel an order if we suspect fraud, pricing errors, or stock issues.</li>
                                <li>Payment must be completed using the available payment methods at checkout (where applicable).</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-base font-semibold text-slate-900">4) Delivery</h2>
                            <ul className="mt-2 list-disc pl-5 space-y-2">
                                <li>Delivery times shown are estimates and can vary due to logistics, weather, or other factors.</li>
                                <li>Ownership and responsibility for the product transfer upon successful delivery to the provided address.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-base font-semibold text-slate-900">5) Returns &amp; Refunds (Important)</h2>
                            <div className="mt-3 rounded-xl bg-amber-50 ring-1 ring-amber-200 p-4">
                                <p className="font-semibold text-amber-900">No refunds after delivery.</p>
                                <p className="text-amber-900/90 mt-1">
                                    Once an order has been delivered, it is considered final: <strong>what goes out cannot return</strong>.
                                    We do not accept returns, exchanges, or refunds for delivered items.
                                </p>
                            </div>
                            <ul className="mt-3 list-disc pl-5 space-y-2">
                                <li>Please review product details carefully before placing an order.</li>
                                <li>If you have questions before ordering, contact Support before completing checkout.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-base font-semibold text-slate-900">6) Product Availability</h2>
                            <p className="mt-2">
                                Products may become unavailable or out of stock. We reserve the right to limit quantities and to update
                                product information at any time.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-base font-semibold text-slate-900">7) Prohibited Use</h2>
                            <ul className="mt-2 list-disc pl-5 space-y-2">
                                <li>Do not misuse the website, attempt to gain unauthorized access, or disrupt our systems.</li>
                                <li>Do not use the website for illegal activities or to violate the rights of others.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-base font-semibold text-slate-900">8) Intellectual Property</h2>
                            <p className="mt-2">
                                All content on this website (text, images, branding, and layout) is owned by or licensed to us and may
                                not be copied or reused without permission.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-base font-semibold text-slate-900">9) Limitation of Liability</h2>
                            <p className="mt-2">
                                To the maximum extent permitted by law, we are not liable for indirect, incidental, or consequential
                                damages arising from the use of the website or products purchased.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-base font-semibold text-slate-900">10) Changes to These Terms</h2>
                            <p className="mt-2">
                                We may update these Terms &amp; Conditions at any time. Updates take effect once posted on this page.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-base font-semibold text-slate-900">11) Contact</h2>
                            <p className="mt-2">
                                For questions about these Terms, please visit our{' '}
                                <Link to="/support" className="text-blue-600 hover:text-blue-700 font-medium no-underline">
                                    Support
                                </Link>{' '}
                                page.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

