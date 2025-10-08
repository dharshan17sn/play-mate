import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const PrivacyPolicyPage: React.FC = () => {
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
                    <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900">Privacy Policy</h1>
                    <p className="mt-3 text-sm text-gray-500">Last updated: September 26, 2025</p>
                    <p className="mt-4 text-gray-600 max-w-3xl">
                        How Play‑Mate collects, uses, and safeguards your data across team matching, chats, and tournaments.
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
                            <li><a href="#collect" className="hover:text-blue-600">Information We Collect</a></li>
                            <li><a href="#use" className="hover:text-blue-600">How We Use It</a></li>
                            <li><a href="#legal" className="hover:text-blue-600">Legal Bases</a></li>
                            <li><a href="#share" className="hover:text-blue-600">Sharing</a></li>
                            <li><a href="#retention" className="hover:text-blue-600">Retention</a></li>
                            <li><a href="#rights" className="hover:text-blue-600">Your Rights</a></li>
                            <li><a href="#security" className="hover:text-blue-600">Security</a></li>
                            <li><a href="#transfers" className="hover:text-blue-600">International Transfers</a></li>
                            <li><a href="#children" className="hover:text-blue-600">Children</a></li>
                            <li><a href="#contact" className="hover:text-blue-600">Contact</a></li>
                        </ul>
                    </div>
                </aside>

                {/* Body */}
                <article className="lg:col-span-9">
                    <div className="bg-white border rounded-lg p-6 md:p-8 shadow-sm">
                        <section id="collect" className="prose prose-blue max-w-none">
                            <p>
                                At Play‑Mate, we respect your privacy and are committed to protecting your personal data. This policy
                                explains what we collect, how we use it, and the choices you have. It applies to our website,
                                apps, and services (collectively, the “Services”).
                            </p>
                            <h2>Information We Collect</h2>
                            <ul>
                                <li><strong>Account data</strong>: email, username, display name, and password.</li>
                                <li><strong>Profile data</strong>: gender, location, preferred games, preferred days and time ranges.</li>
                                <li><strong>Usage data</strong>: logs, device information, and interactions with features such as teams, chats, and tournaments.</li>
                                <li><strong>Communications</strong>: messages sent to support and contact forms.</li>
                                <li><strong>Cookies</strong>: as described in our <Link to="/cookies" className="text-blue-600 hover:text-blue-700">Cookie Policy</Link>.</li>
                            </ul>
                        </section>

                        <section id="use" className="prose prose-blue max-w-none mt-10">
                            <h2>How We Use Your Information</h2>
                            <ul>
                                <li>Provide and improve team matching, chat, and tournament features.</li>
                                <li>Personalize your experience and show relevant content (e.g., games you prefer).</li>
                                <li>Maintain safety, security, and integrity of the Services.</li>
                                <li>Send service updates and transactional notifications.</li>
                                <li>Respond to support requests and enforce our <Link to="/terms" className="text-blue-600 hover:text-blue-700">Terms</Link>.</li>
                            </ul>
                        </section>

                        <section id="legal" className="prose prose-blue max-w-none mt-10">
                            <h2>Legal Bases</h2>
                            <p>We process personal data with your consent, to perform our contract with you, to comply with law, and for our legitimate interests (such as keeping the platform safe and improving features).</p>
                        </section>

                        <section id="share" className="prose prose-blue max-w-none mt-10">
                            <h2>Sharing and Disclosure</h2>
                            <ul>
                                <li><strong>Service providers</strong> who help us operate the Services (e.g., hosting, analytics).</li>
                                <li><strong>Team and chat participants</strong> when you choose to share messages or join teams.</li>
                                <li><strong>Legal</strong> when required by law or to protect rights, safety, and security.</li>
                            </ul>
                        </section>

                        <section id="retention" className="prose prose-blue max-w-none mt-10">
                            <h2>Data Retention</h2>
                            <p>We keep your data as long as needed to provide the Services and for legitimate business or legal purposes. You can request deletion of your account; we will delete or anonymize data unless retention is required by law.</p>
                        </section>

                        <section id="rights" className="prose prose-blue max-w-none mt-10">
                            <h2>Your Choices and Rights</h2>
                            <ul>
                                <li>Access, update, or delete your profile via Account settings.</li>
                                <li>Manage notification preferences in‑app.</li>
                                <li>Control cookies via your browser or our cookie settings.</li>
                                <li>Contact us to exercise applicable data rights via the <Link to="/contact" className="text-blue-600 hover:text-blue-700">Contact page</Link>.</li>
                            </ul>
                        </section>

                        <section id="security" className="prose prose-blue max-w-none mt-10">
                            <h2>Security</h2>
                            <p>We use reasonable technical and organizational measures to protect your data. No method is 100% secure; please use strong passwords and keep your credentials safe.</p>
                        </section>

                        <section id="transfers" className="prose prose-blue max-w-none mt-10">
                            <h2>International Transfers</h2>
                            <p>Your data may be transferred and processed in countries other than your own. We take steps to ensure appropriate safeguards are in place.</p>
                        </section>

                        <section id="children" className="prose prose-blue max-w-none mt-10">
                            <h2>Children</h2>
                            <p>Play‑Mate is not directed to children under 13 (or the minimum age in your country). If we learn we have collected such data, we will delete it.</p>
                        </section>

                        <section id="contact" className="prose prose-blue max-w-none mt-10">
                            <h2>Contact</h2>
                            <p>Questions about this policy? Visit our <Link to="/contact" className="text-blue-600 hover:text-blue-700">Contact</Link> page.</p>
                        </section>
                    </div>
                </article>
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;


