import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const CookiePolicyPage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            {/* Hero */}
            <div className="bg-white border-b">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-4 inline-flex items-center px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900">Cookie Policy</h1>
                    <p className="mt-3 text-sm text-gray-500">Last updated: September 26, 2025</p>
                    <p className="mt-4 text-gray-600 max-w-3xl">
                        How Play‑Mate uses cookies and similar technologies to deliver a reliable, personalized experience.
                    </p>
                </div>
            </div>

            {/* Content with TOC */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-12 gap-8">
                {/* TOC */}
                <aside className="lg:col-span-3 hidden lg:block">
                    <div className="sticky top-24 bg-white border rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">On this page</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li><a href="#what" className="hover:text-blue-600">What Are Cookies?</a></li>
                            <li><a href="#types" className="hover:text-blue-600">Types of Cookies</a></li>
                            <li><a href="#manage" className="hover:text-blue-600">Managing Cookies</a></li>
                            <li><a href="#third" className="hover:text-blue-600">Third‑Party Cookies</a></li>
                            <li><a href="#updates" className="hover:text-blue-600">Updates</a></li>
                            <li><a href="#contact" className="hover:text-blue-600">Contact</a></li>
                        </ul>
                    </div>
                </aside>

                {/* Body */}
                <article className="lg:col-span-9">
                    <div className="bg-white border rounded-lg p-6 md:p-8 shadow-sm">
                        <section id="what" className="prose prose-blue max-w-none">
                            <p>
                                This Cookie Policy explains how Play‑Mate uses cookies and similar technologies to
                                provide, protect, and improve our Services.
                            </p>
                            <h2>What Are Cookies?</h2>
                            <p>Cookies are small text files stored on your device. They help us remember your preferences and understand how you use the platform.</p>
                        </section>

                        <section id="types" className="prose prose-blue max-w-none mt-10">
                            <h2>Types of Cookies We Use</h2>
                            <ul>
                                <li><strong>Strictly necessary</strong>: required for core features like authentication and security.</li>
                                <li><strong>Performance</strong>: help us understand usage and improve reliability.</li>
                                <li><strong>Functionality</strong>: remember choices such as preferred games and UI settings.</li>
                                <li><strong>Analytics</strong>: help us analyze feature adoption and improve matchmaking quality.</li>
                            </ul>
                        </section>

                        <section id="manage" className="prose prose-blue max-w-none mt-10">
                            <h2>Managing Cookies</h2>
                            <p>You can control cookies through your browser settings. Disabling certain cookies may affect functionality (e.g., staying signed in).</p>
                        </section>

                        <section id="third" className="prose prose-blue max-w-none mt-10">
                            <h2>Do We Use Third‑Party Cookies?</h2>
                            <p>We may use trusted providers for analytics or error tracking. These providers may set their own cookies according to their policies.</p>
                        </section>

                        <section id="updates" className="prose prose-blue max-w-none mt-10">
                            <h2>Updates</h2>
                            <p>We may update this policy as our Services evolve. We’ll post the updated version here. You can also review our <Link to="/privacy" className="text-blue-600 hover:text-blue-700">Privacy Policy</Link> and <Link to="/terms" className="text-blue-600 hover:text-blue-700">Terms</Link>.</p>
                        </section>

                        <section id="contact" className="prose prose-blue max-w-none mt-10">
                            <h2>Contact</h2>
                            <p>Questions? Visit our <Link to="/contact" className="text-blue-600 hover:text-blue-700">Contact</Link> page.</p>
                        </section>
                    </div>
                </article>
            </div>
        </div>
    );
};

export default CookiePolicyPage;


