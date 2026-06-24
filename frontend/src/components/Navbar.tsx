import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import ShinyText from '../components/ShinyText';

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isScrolled, setIsScrolled] = useState(false);
    const [user, setUser] = useState<{ displayName: string; photo?: string } | null>(null);

    const isAuthenticated = apiService.isAuthenticated();
    const isAdmin = apiService.isAdmin();
    const isAdminPage = location.pathname === '/admin';

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            setIsScrolled(scrollTop > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            apiService.getProfile().then(res => {
                if (res.success && res.data) {
                    setUser(res.data);
                }
            }).catch(err => {
                console.error("Error fetching user profile for navbar:", err);
            });
        } else {
            setUser(null);
        }
    }, [isAuthenticated]);

    const handleHomeClick = () => {
        if (isAuthenticated) {
            navigate('/dashboard');
        } else {
            navigate('/');
        }
    };

    const handleHashClick = (hash: string) => {
        if (location.pathname === '/') {
            const element = document.getElementById(hash.substring(1));
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            navigate(`/${hash}`);
        }
    };

    const handleLogout = () => {
        apiService.logout();
    };

    return (
        <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${isScrolled
            ? 'bg-white shadow-lg'
            : 'bg-gradient-to-b from-indigo-900/90 to-transparent'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Left - Logo/Brand */}
                    <div className="flex-shrink-0 cursor-pointer" onClick={handleHomeClick}>
                        <h1 className={`font-logo text-3xl transition-colors duration-300 ${isScrolled ? 'text-gray-900' : 'text-indigo-200'
                            }`}>
                            PlayMate
                        </h1>
                    </div>

                    {/* Middle - Navigation Links */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-8 font-nav">
                            {isAdminPage ? (
                                <>
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${isScrolled
                                            ? 'text-gray-700 hover:text-blue-600'
                                            : 'text-purple-200 hover:text-purple-100'
                                            }`}
                                    >
                                        Dashboard
                                    </button>
                                    <button
                                        onClick={() => navigate('/admin')}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${isScrolled
                                            ? 'text-indigo-650 hover:text-indigo-700 font-semibold'
                                            : 'text-indigo-200 hover:text-indigo-100 font-semibold'
                                            }`}
                                    >
                                        Admin Panel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={handleHomeClick}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${isScrolled
                                            ? 'text-gray-700 hover:text-blue-600'
                                            : 'text-purple-200 hover:text-purple-100'
                                            }`}
                                    >
                                        Home
                                    </button>
                                    {isAdmin && (
                                        <button
                                            onClick={() => navigate('/admin')}
                                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${isScrolled
                                                ? 'text-indigo-650 hover:text-indigo-700 font-semibold'
                                                : 'text-indigo-200 hover:text-indigo-105 font-semibold'
                                                }`}
                                        >
                                            Admin Panel
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleHashClick('#features')}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${isScrolled
                                            ? 'text-gray-700 hover:text-blue-600'
                                            : 'text-purple-200 hover:text-purple-100'
                                            }`}
                                    >
                                        Features
                                    </button>
                                    <button
                                        onClick={() => handleHashClick('#about')}
                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${isScrolled
                                            ? 'text-gray-700 hover:text-blue-600'
                                            : 'text-purple-200 hover:text-purple-100'
                                            }`}
                                    >
                                        About Us
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => navigate('/contact', { state: { from: isAdminPage ? 'dashboard' : 'landing' } })}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${isScrolled
                                    ? 'text-gray-700 hover:text-blue-600'
                                    : 'text-purple-200 hover:text-purple-100'
                                    }`}
                            >
                                Contact / Support
                            </button>
                        </div>
                    </div>

                    {/* Right - Auth Buttons */}
                    <div className="flex items-center space-x-2 sm:space-x-4 font-nav">
                        {isAuthenticated ? (
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => navigate('/profile-creation')}
                                    className="flex items-center space-x-2 p-1 rounded-full hover:bg-slate-100/10 transition-colors cursor-pointer"
                                    title="View Profile Settings"
                                >
                                    {user?.photo ? (
                                        <img 
                                            src={user.photo} 
                                            alt={user.displayName || 'Profile'} 
                                            className="w-8 h-8 rounded-full object-cover border border-indigo-400 shrink-0"
                                            onError={(e) => {
                                                (e.target as any).style.display = 'none';
                                                const parent = (e.target as any).parentElement;
                                                if (parent) {
                                                    const fallback = parent.querySelector('.navbar-fallback-avatar');
                                                    if (fallback) (fallback as HTMLElement).style.display = 'flex';
                                                }
                                            }}
                                        />
                                    ) : null}
                                    <div 
                                        className="navbar-fallback-avatar w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 font-bold flex items-center justify-center text-[10px] uppercase shrink-0"
                                        style={{ display: user?.photo ? 'none' : 'flex' }}
                                    >
                                        {(user?.displayName || 'U').substring(0, 2)}
                                    </div>
                                    <span className={`hidden sm:inline-block text-xs font-semibold max-w-[100px] truncate ${isScrolled ? 'text-gray-750' : 'text-indigo-200'}`}>
                                        {user?.displayName || 'Profile'}
                                    </span>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border cursor-pointer ${isScrolled
                                        ? 'bg-red-50 hover:bg-red-100/80 border-red-200 text-red-650'
                                        : 'bg-indigo-950/60 border-indigo-800 hover:bg-indigo-900/60 text-indigo-200 hover:text-white'
                                        }`}
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => navigate('/login')}
                                    className={`px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${isScrolled
                                        ? 'text-gray-700 hover:text-blue-600'
                                        : 'text-rose-200 hover:text-rose-100'
                                        }`}
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => navigate('/register')}
                                    className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${isScrolled
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white shadow-lg'
                                        }`}
                                >
                                   <ShinyText text="Join Now" disabled={false} speed={3} className='custom-class' />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
