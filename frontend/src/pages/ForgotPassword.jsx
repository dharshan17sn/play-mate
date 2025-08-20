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

export default function ForgotPassword() {
    const [email, setEmail] = useState('')

    return (
        <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center px-4">
            <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h1 className="text-xl font-bold text-neutral-900">Reset password</h1>
                <p className="mt-1 text-sm text-neutral-600">Enter your email and we'll send you a reset link.</p>

                <form className="mt-6 space-y-4">
                    <Input id="email" label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                    <Button className="w-full">Send reset link</Button>
                </form>

                <div className="mt-6 text-sm">
                    <a href="/signin" className="text-neutral-600 hover:text-neutral-900">Back to sign in</a>
                </div>
            </div>
        </div>
    )
}
