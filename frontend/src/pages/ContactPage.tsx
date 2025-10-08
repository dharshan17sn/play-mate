import React, { useState } from 'react';
// import Navbar from '../components/Navbar';
import { apiService } from '../services/api';
import { useLocation, useNavigate } from 'react-router-dom';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ContactPage: React.FC = () => {
    const [form, setForm] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
        gameIdea: ''
    });
    const navigate = useNavigate();
    const location = useLocation() as any;
    const from = location?.state?.from as 'landing' | 'profile' | undefined;
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [status, setStatus] = useState<{ type: 'idle' | 'submitting' | 'success' | 'error'; message?: string }>({ type: 'idle' });

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = 'Name is required';
        if (!form.email.trim()) e.email = 'Email is required';
        else if (!emailPattern.test(form.email)) e.email = 'Enter a valid email address';
        if (!form.subject.trim()) e.subject = 'Subject is required';
        if (!form.message.trim()) e.message = 'Message is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const onChange = (evt: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [evt.target.name]: evt.target.value }));
    };

    const onSubmit = async (evt: React.FormEvent) => {
        evt.preventDefault();
        if (!validate()) return;
        setStatus({ type: 'submitting' });
        try {
            const res = await apiService.submitContact(form);
            setStatus({ type: 'success', message: res.message || 'Message sent!' });
            setForm({ name: '', email: '', subject: '', message: '', gameIdea: '' });
        } catch (err: any) {
            setStatus({ type: 'error', message: err?.message || 'Failed to send. Try again later.' });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* <Navbar /> */}
            <section className="py-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 flex items-center justify-between max-w-md mx-auto">
                        <div className="flex items-center">
                            <button
                                type="button"
                                onClick={() => {
                                    if (from === 'profile') {
                                        navigate('/profile-creation');
                                    } else if (from === 'landing') {
                                        navigate('/');
                                    } else {
                                        navigate(-1);
                                    }
                                }}
                                className="mr-3 inline-flex items-center px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                {from === 'profile' ? 'Back to Profile' : from === 'landing' ? 'Back to Home' : 'Back'}
                            </button>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center">Contact Us</h1>
                        <div className="relative group">
                            <button
                                type="button"
                                aria-label="Help info"
                                className="ml-2 w-6 h-6 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                            >
                                ?
                            </button>
                            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 p-3 rounded-md border border-gray-200 bg-white text-xs text-gray-700 shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                • To request a new game, include the game name in "Game Idea".<br />
                                • For website queries, describe the issue in "Description".<br />
                                • We typically respond within 24-48 hours.
                            </div>
                        </div>
                    </div>
                    {status.type === 'success' && (
                        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 text-green-800 p-4">{status.message}</div>
                    )}
                    {status.type === 'error' && (
                        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 text-red-800 p-4">{status.message}</div>
                    )}
                    <form onSubmit={onSubmit} className="bg-white rounded-xl border p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                            <input name="name" value={form.name} onChange={onChange} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="John Doe" />
                            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Your Email</label>
                            <input name="email" type="email" value={form.email} onChange={onChange} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="you@example.com" />
                            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                            <input name="subject" value={form.subject} onChange={onChange} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Create a new game" />
                            {errors.subject && <p className="text-sm text-red-600 mt-1">{errors.subject}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Game Idea (optional)</label>
                            <input name="gameIdea" value={form.gameIdea} onChange={onChange} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Tell us the game name or idea" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea name="message" value={form.message} onChange={onChange} rows={6} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Describe your request or question"></textarea>
                            {errors.message && <p className="text-sm text-red-600 mt-1">{errors.message}</p>}
                        </div>
                        <div className="flex justify-end">
                            <button disabled={status.type === 'submitting'} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-semibold">
                                {status.type === 'submitting' ? 'Sending...' : 'Send Message'}
                            </button>
                        </div>
                    </form>
                </div>
            </section>
        </div>
    );
};

export default ContactPage;


