import React, { useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Button } from '../../components/ui/button.jsx'

function PlayerCard({ player }) {
    const [pending, setPending] = useState(false)
    const [accepted, setAccepted] = useState(false)

    function sendRequest() {
        setPending(true)
        setTimeout(() => {
            setPending(false)
            setAccepted(true)
        }, 1000)
    }

    return (
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-start justify-between">
                <div>
                    <div className="font-semibold">{player.name}</div>
                    <div className="text-xs text-neutral-500">{player.distance} km away</div>
                </div>
                <div className="text-neutral-500">
                    {pending ? '⏳ Pending' : accepted ? '💬 Message' : ''}
                </div>
            </div>
            <div className="mt-3 text-sm">
                <div className="font-medium text-neutral-700">Availability</div>
                <ul className="mt-1 list-disc pl-5 text-neutral-600">
                    {player.availability.map((a, i) => (
                        <li key={i}>{a}</li>
                    ))}
                </ul>
            </div>
            <div className="mt-4 flex gap-2">
                {!accepted && (
                    <>
                        <Button onClick={sendRequest}>Connection request</Button>
                        <Button variant="outline" onClick={sendRequest}>Team invite</Button>
                    </>
                )}
                {accepted && (
                    <Button asChild>
                        <Link to="/workspace/messages">Open chat</Link>
                    </Button>
                )}
            </div>
        </div>
    )
}

export default function Players() {
    const [search] = useSearchParams()
    const game = search.get('game') || 'All'

    const players = useMemo(() => {
        const base = [
            { name: 'Ravi', distance: 2.3, availability: ['Saturday 4pm – 6pm', 'Sunday 8am – 12pm'], game: 'Cricket' },
            { name: 'Neha', distance: 5.8, availability: ['Friday 6pm – 8pm', 'Saturday 7am – 9am'], game: 'Cricket' },
            { name: 'Arun', distance: 1.2, availability: ['Sunday 7am – 10am'], game: 'Football' },
            { name: 'Priya', distance: 3.4, availability: ['Saturday 2pm – 5pm'], game: 'Badminton' },
        ]
        return base
            .filter(p => (game === 'All' ? true : p.game === game))
            .sort((a, b) => a.distance - b.distance)
    }, [game])

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-4 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Players {game !== 'All' ? `for ${game}` : ''}</h2>
                    <p className="text-sm text-neutral-600">Sorted by distance from your location</p>
                </div>
                <Link to="/workspace" className="text-sm text-neutral-600 hover:text-neutral-900">← Back to games</Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {players.map((p, i) => (
                    <PlayerCard key={i} player={p} />
                ))}
            </div>
        </div>
    )
}


