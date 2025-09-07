import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import LogoCarousel from '../components/LogoCarousel';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* Hero Section */}
            <section
                id="home"
                className="hero-section relative h-screen overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 md:bg-transparent"
            >
                {/* Desktop background via HTML (hidden on mobile) */}
                <div className="hidden md:block absolute inset-0 z-0">
                    <iframe
                        src="/2.html"
                        title="Background"
                        className="w-full h-full"
                        style={{ border: 'none', pointerEvents: 'none' }}
                    />
                </div>
                {/* Content */}
                <div className="relative z-10 pt-16 h-full flex items-center">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                        <div className="text-center md:text-left max-w-2xl font-hero">
                            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
                                Find Your Perfect
                                <span className="text-blue-300"> Gaming Team</span>
                            </h1>
                            <p className="text-xl text-gray-100 mb-8 font-hero">
                                Connect with like-minded gamers, build teams, and dominate the competition.
                                Play-Mate makes it easy to find teammates who share your passion and skill level.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                <button
                                    onClick={() => navigate('/register')}
                                    className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-600 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors duration-200 shadow-lg"
                                >
                                    Get Started
                                </button>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-lg text-lg font-semibold transition-colors duration-200"
                                >
                                    Learn More
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Why Choose Play-Mate?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Everything you need to build the perfect gaming team
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center p-6">
                            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Matching</h3>
                            <p className="text-gray-600">
                                Find teammates based on your skill level, game preferences, and availability
                            </p>
                        </div>

                        <div className="text-center p-6">
                            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Verified Players</h3>
                            <p className="text-gray-600">
                                Connect with verified gamers who are serious about team play
                            </p>
                        </div>

                        <div className="text-center p-6">
                            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Team Management</h3>
                            <p className="text-gray-600">
                                Create, manage, and organize your teams with powerful tools
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Us Section */}
            <section id="about" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                                About Play-Mate
                            </h2>
                            <p className="text-lg text-gray-600 mb-6">
                                We're passionate gamers who understand the struggle of finding the right teammates.
                                That's why we built Play-Mate - to connect gamers and create amazing teams.
                            </p>
                            <p className="text-lg text-gray-600 mb-8">
                                Whether you're a casual player looking for fun or a competitive gamer seeking glory,
                                Play-Mate helps you find your perfect match.
                            </p>
                            <button
                                onClick={() => navigate('/register')}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                            >
                                Learn More About Us
                            </button>
                        </div>
                        <div className="text-center">
                            <div className="bg-gray-200 w-full h-64 rounded-lg flex items-center justify-center">
                                <p className="text-gray-500">Background Image Placeholder</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Logo Carousel */}
            <LogoCarousel />

            {/* Contact/Support Section */}
            <section id="contact" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Get in Touch
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Have questions? Need support? We're here to help!
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                        <div>
                            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Contact Information</h3>
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-gray-600">support@playmate.com</span>
                                </div>
                                <div className="flex items-center">
                                    <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <span className="text-gray-600">Live Chat Available</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Quick Support</h3>
                            <div className="space-y-4">
                                <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors duration-200">
                                    <h4 className="font-semibold text-gray-900">How to create a team?</h4>
                                    <p className="text-gray-600 text-sm">Learn the basics of team creation</p>
                                </button>
                                <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors duration-200">
                                    <h4 className="font-semibold text-gray-900">Account settings</h4>
                                    <p className="text-gray-600 text-sm">Manage your profile and preferences</p>
                                </button>
                                <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors duration-200">
                                    <h4 className="font-semibold text-gray-900">Report an issue</h4>
                                    <p className="text-gray-600 text-sm">Help us improve by reporting bugs</p>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-xl font-bold mb-4">Play-Mate</h3>
                            <p className="text-gray-400">
                                Connecting gamers, building teams, creating legends.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Platform</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors duration-200">Games</a></li>
                                <li><a href="#" className="hover:text-white transition-colors duration-200">Teams</a></li>
                                <li><a href="#" className="hover:text-white transition-colors duration-200">Tournaments</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Support</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors duration-200">Help Center</a></li>
                                <li><a href="#" className="hover:text-white transition-colors duration-200">Contact Us</a></li>
                                <li><a href="#" className="hover:text-white transition-colors duration-200">FAQ</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors duration-200">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition-colors duration-200">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-white transition-colors duration-200">Cookie Policy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2024 Play-Mate. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
