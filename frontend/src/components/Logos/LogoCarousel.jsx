import React from 'react'

function LogoBadge({ label }) {
    return (
        <div className="logo-item select-none">
            {label}
        </div>
    )
}

function Track({ items }) {
    return (
        <div className="logo-track">
            {items.concat(items).map((label, idx) => (
                <LogoBadge key={idx} label={label} />
            ))}
        </div>
    )
}

function LogoCarousel() {
    const games = [
        'Cricket',
        'Football',
        'Kabaddi',
        'Badminton',
        'Volleyball',
        'Basketball',
        'Table Tennis',
        'Chess',
        'Carrom',
        'Ludo',
        'Darts',
        'Snooker',
        'Board Games',
        'Card Games',
    ]

    return (
        <section className="bg-white pt-12 pb-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">Offline games on Playmate</h3>
                </div>
                <div className="logo-marquee">
                    <Track items={games} />
                </div>
            </div>
        </section>
    )
}

export default LogoCarousel
