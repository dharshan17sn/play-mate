import React, { useState } from 'react'
import { Button } from '../components/ui/button.jsx'

function Input({ id, label, type = 'text', value, onChange, placeholder }) {
    return (
        <div className="space-y-1">
            <label htmlFor={id} className="block text-sm font-medium text-neutral-700">{label}</label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            />
        </div>
    )
}

export default function SignUp() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    return (
        <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center px-4">
            <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h1 className="text-xl font-bold text-neutral-900">Create account</h1>
                <p className="mt-1 text-sm text-neutral-600">Join Playmate to connect with offline gamers near you.</p>

                <form className="mt-6 space-y-4">
                    <Input id="email" label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                    <Input id="password" label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                    <Button className="w-full">Sign Up</Button>
                </form>

                <div className="mt-4 flex items-center gap-4">
                    <div className="h-px w-full bg-neutral-200" />
                    <span className="text-xs uppercase tracking-wider text-neutral-500">OR</span>
                    <div className="h-px w-full bg-neutral-200" />
                </div>

                <div className="mt-4">
                    <Button variant="outline" className="w-full" asChild>
                        <a href="#" aria-label="Sign up with Google">Continue with Google</a>
                    </Button>
                </div>

                <div className="mt-6 flex items-center justify-between text-sm">
                    <a href="/forgot-password" className="text-neutral-600 hover:text-neutral-900">Forgot password?</a>
                    <div className="text-neutral-600">
                        Already have an account? <a href="/signin" className="font-medium text-neutral-900 hover:underline">Sign in</a>
                    </div>
                </div>
            </div>
        </div>
    )
}
