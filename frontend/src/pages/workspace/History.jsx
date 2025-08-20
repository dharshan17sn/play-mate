import React from 'react'

export default function History() {
    const items = [
        { title: 'Matched with Ravi for Cricket', date: 'May 27, 2025' },
        { title: 'Team invite sent to Neha', date: 'May 26, 2025' },
    ]

    return (
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="font-semibold">History</div>
            <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                {items.map((it, i) => (
                    <li key={i} className="flex items-center justify-between">
                        <span>{it.title}</span>
                        <span className="text-neutral-400">{it.date}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}


