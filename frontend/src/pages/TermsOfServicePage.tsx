import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const TermsOfServicePage: React.FC = () => {
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
                    <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900">Terms of Service</h1>
                    <p className="mt-3 text-sm text-gray-500">Last updated: September 26, 2025</p>
                    <p className="mt-4 text-gray-600 max-w-3xl">
                        Rules that keep Play‑Mate safe and enjoyable for everyone.
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
                            <li><a href="#accounts" className="hover:text-blue-600">Accounts</a></li>
                            <li><a href="#use" className="hover:text-blue-600">Use of the Services</a></li>
                            <li><a href="#content" className="hover:text-blue-600">Content</a></li>
                            <li><a href="#payments" className="hover:text-blue-600">Payments & Tournaments</a></li>
                            <li><a href="#disclaimers" className="hover:text-blue-600">Disclaimers</a></li>
                            <li><a href="#liability" className="hover:text-blue-600">Limitation of Liability</a></li>
                            <li><a href="#indemnity" className="hover:text-blue-600">Indemnification</a></li>
                            <li><a href="#changes" className="hover:text-blue-600">Changes</a></li>
                            <li><a href="#contact" className="hover:text-blue-600">Contact</a></li>
                        </ul>
                    </div>
                </aside>

                {/* Body */}
                <article className="lg:col-span-9">
                    <div className="bg-white border rounded-lg p-6 md:p-8 shadow-sm">
                        <section className="prose prose-blue max-w-none">
                            <p>
                                Welcome to Play‑Mate. By accessing or using our Services, you agree to these Terms.
                                If you do not agree, do not use the Services.
                            </p>
                        </section>

                        <section id="accounts" className="prose prose-blue max-w-none mt-10">
                            <h2>Accounts</h2>
                            <ul>
                                <li>You must provide accurate information and keep your account secure.</li>
                                <li>You are responsible for activity that occurs under your account.</li>
                                <li>We may suspend or terminate accounts for violations of these Terms.</li>
                            </ul>
                        </section>

                        <section id="use" className="prose prose-blue max-w-none mt-10">
                            <h2>Use of the Services</h2>
                            <ul>
                                <li>Follow all applicable laws and respect other users.</li>
                                <li>No harassment, hate speech, cheating, or illegal activity.</li>
                                <li>Do not attempt to disrupt, reverse engineer, or misuse the platform.</li>
                            </ul>
                        </section>

                        <section id="content" className="prose prose-blue max-w-none mt-10">
                            <h2>Content</h2>
                            <ul>
                                <li>You retain rights to content you post. You grant us a license to host and display it as needed to operate the Services.</li>
                                <li>Do not post content that infringes others’ rights or violates law.</li>
                                <li>We may remove content that violates these Terms.</li>
                            </ul>
                        </section>

                        <section id="payments" className="prose prose-blue max-w-none mt-10">
                            <h2>Payments and Tournaments</h2>
                            <p>If features include entry fees or prizes, additional rules may apply. We will provide details for specific events where applicable.</p>
                        </section>

                        <section id="disclaimers" className="prose prose-blue max-w-none mt-10">
                            <h2>Disclaimers</h2>
                            <p>The Services are provided “as is” without warranties of any kind. We do not guarantee continuous, error‑free operation.</p>
                        </section>

                        <section id="liability" className="prose prose-blue max-w-none mt-10">
                            <h2>Limitation of Liability</h2>
                            <p>To the fullest extent permitted by law, Play‑Mate will not be liable for indirect, incidental, special, consequential, or punitive damages, or any loss of profits or data.</p>
                        </section>

                        <section id="indemnity" className="prose prose-blue max-w-none mt-10">
                            <h2>Indemnification</h2>
                            <p>You agree to defend and indemnify Play‑Mate from claims arising out of your use of the Services or violation of these Terms.</p>
                        </section>

                        <section id="changes" className="prose prose-blue max-w-none mt-10">
                            <h2>Changes</h2>
                            <p>We may update these Terms. If changes are material, we’ll provide notice. Continued use means you accept the updated Terms.</p>
                        </section>

                        <section id="contact" className="prose prose-blue max-w-none mt-10">
                            <h2>Contact</h2>
                            <p>For questions about these Terms, please reach out via our <Link to="/contact" className="text-blue-600 hover:text-blue-700">Contact</Link> page and review our <Link to="/privacy" className="text-blue-600 hover:text-blue-700">Privacy Policy</Link>.</p>
                        </section>
                    </div>
                </article>
            </div>
        </div>
    );
};

export default TermsOfServicePage;


