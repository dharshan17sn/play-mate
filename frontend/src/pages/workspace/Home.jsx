import React, { useState } from 'react'
import { Button } from '../../components/ui/button.jsx'
import { Link } from 'react-router-dom'

const games = [
    { name: 'Cricket' },
    { name: 'Football' },
    { name: 'Kabaddi' },
    { name: 'Badminton' },
    { name: 'Chess' },
]

function PlayerCard({ player }) {
    const [pending, setPending] = useState(false)
    const [accepted, setAccepted] = useState(false)

    function sendRequest() {
        setPending(true)
        setTimeout(() => {
            setPending(false)
            setAccepted(true)
        }, 1200)
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
                        <a href="/workspace/messages">Open chat</a>
                    </Button>
                )}
            </div>
        </div>
    )
}

export default function WorkspaceHome() {
    const [selected, setSelected] = useState(null)

    const samplePlayers = [
        {
            name: 'Ravi',
            distance: 2.3,
            availability: ['Saturday 4pm – 6pm', 'Sunday 8am – 12pm'],
        },
        {
            name: 'Neha',
            distance: 5.8,
            availability: ['Friday 6pm – 8pm', 'Saturday 7am – 9am'],
        },
    ]

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <h2 className="text-lg font-semibold">Games</h2>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {games.map(g => (
                        <div key={g.name} className="rounded-xl border border-neutral-200 p-4">
                            <div className="text-base font-semibold">{g.name}</div>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <Button asChild>
                                    <Link to={`/workspace/players?game=${encodeURIComponent(g.name)}`}>Find players</Link>
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link to={`/workspace/tournaments?game=${encodeURIComponent(g.name)}`}>Tournaments</Link>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selected && (
                <div className="space-y-4">
                    <div className="rounded-xl border border-neutral-200 bg-white p-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Finding players for {selected}</h3>
                            <div className="text-sm text-neutral-500">Sorted by distance</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {samplePlayers.map((p, i) => (
                            <PlayerCard key={i} player={p} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}


