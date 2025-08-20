import React from 'react'

export function Card({ className = '', children }) {
    return (
        <div className={`rounded-xl border border-neutral-200 bg-white ${className}`}>
            {children}
        </div>
    )
}

export function CardHeader({ className = '', children }) {
    return <div className={`px-6 pt-6 ${className}`}>{children}</div>
}

export function CardTitle({ className = '', children }) {
    return <h3 className={`text-lg font-semibold text-neutral-900 ${className}`}>{children}</h3>
}

export function CardContent({ className = '', children }) {
    return <div className={`px-6 pb-6 ${className}`}>{children}</div>
}

export default Card


