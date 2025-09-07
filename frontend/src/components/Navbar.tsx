import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            setIsScrolled(scrollTop > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleHomeClick = () => {
        if (apiService.isAuthenticated()) {
            navigate('/dashboard');
        } else {
            navigate('/register');
        }
    };

    return (
        <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${isScrolled
            ? 'bg-white shadow-lg'
            : 'bg-transparent'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Left - Logo/Brand */}
                    <div className="flex-shrink-0">
                        <h1 className={`font-logo text-3xl transition-colors duration-300 ${isScrolled ? 'text-gray-900' : 'text-indigo-200'
                            }`}>
                            PlayMate
                        </h1>
                    </div>

                    {/* Middle - Navigation Links */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-8 font-nav">
                            <button
                                onClick={handleHomeClick}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isScrolled
                                    ? 'text-gray-700 hover:text-blue-600'
                                    : 'text-purple-200 hover:text-purple-100'
                                    }`}
                            >
                                Home
                            </button>
                            <a
                                href="#features"
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isScrolled
                                    ? 'text-gray-700 hover:text-blue-600'
                                    : 'text-purple-200 hover:text-purple-100'
                                    }`}
                            >
                                Features
                            </a>
                            <a
                                href="#about"
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isScrolled
                                    ? 'text-gray-700 hover:text-blue-600'
                                    : 'text-purple-200 hover:text-purple-100'
                                    }`}
                            >
                                About Us
                            </a>
                            <a
                                href="#contact"
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isScrolled
                                    ? 'text-gray-700 hover:text-blue-600'
                                    : 'text-purple-200 hover:text-purple-100'
                                    }`}
                            >
                                Contact / Support
                            </a>
                        </div>
                    </div>

                    {/* Right - Auth Buttons */}
                    <div className="flex items-center space-x-2 sm:space-x-4 font-nav">
                        <button
                            onClick={() => navigate('/login')}
                            className={`px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isScrolled
                                ? 'text-gray-700 hover:text-blue-600'
                                : 'text-rose-200 hover:text-rose-100'
                                }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isScrolled
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white shadow-lg'
                                }`}
                        >
                            Join Now
                        </button>
                    </div>
                </div>
            </div>

        </nav>
    );
};

export default Navbar;
