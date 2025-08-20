import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.jsx'

function Benefits() {
    const items = [
        {
            title: 'Meet local players',
            desc: 'Discover people nearby who share your favorite offline games.',
            icon: '📍',
        },
        {
            title: 'Match by availability',
            desc: 'Set when you play and get matched with compatible schedules.',
            icon: '🗓️',
        },
        {
            title: 'Safe & simple',
            desc: 'Control your profile and connect privately before meeting IRL.',
            icon: '🔒',
        },
    ]

    return (
        <section id="benefits" className="bg-white py-16 sm:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">Why Playmate</h2>
                    <p className="mt-2 text-neutral-600">Everything you need to find your next offline teammate.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item, idx) => (
                        <Card key={idx} className="hover:border-neutral-300 transition">
                            <CardHeader>
                                <CardTitle>
                                    <div className="flex items-center gap-3">
                                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-lg">{item.icon}</div>
                                        <span>{item.title}</span>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-neutral-600">{item.desc}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="mt-10 text-center">
                    <a href="#get-started" className="inline-flex items-center justify-center rounded-md bg-black text-white hover:bg-neutral-900 px-5 py-2.5 text-sm font-medium transition">Get Started</a>
                </div>
            </div>
        </section>
    )
}

export default Benefits
