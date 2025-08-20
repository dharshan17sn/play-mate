import React, { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/ui/button.jsx'

const allTournaments = [
    { id: 1, name: 'City Cricket Cup', game: 'Cricket', date: 'Jun 10', location: 'Marina Grounds' },
    { id: 2, name: 'Sunday Football 5s', game: 'Football', date: 'Jun 12', location: 'Sky Turf' },
    { id: 3, name: 'Smash Open', game: 'Badminton', date: 'Jun 15', location: 'Community Hall' },
]

export default function Tournaments() {
    const [search, setSearch] = useSearchParams()
    const [gameFilter, setGameFilter] = useState(search.get('game') || 'All')

    const list = useMemo(() => {
        return allTournaments.filter(t => (gameFilter === 'All' ? true : t.game === gameFilter))
    }, [gameFilter])

    function updateFilter(value) {
        setGameFilter(value)
        setSearch(value === 'All' ? {} : { game: value })
    }

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-4 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Tournaments</h2>
                    <p className="text-sm text-neutral-600">Browse active tournaments or create your own</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/workspace" className="text-sm text-neutral-600 hover:text-neutral-900">← Back to games</Link>
                    <Button asChild>
                        <Link to="/workspace/tournaments/create">Create a tournament</Link>
                    </Button>
                </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex items-center gap-3 text-sm">
                    <span className="text-neutral-600">Filter:</span>
                    {['All', 'Cricket', 'Football', 'Badminton'].map(g => (
                        <button
                            key={g}
                            onClick={() => updateFilter(g)}
                            className={`rounded-md border px-3 py-1 ${gameFilter === g ? 'bg-black text-white border-black' : 'border-neutral-200 hover:bg-neutral-100'}`}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {list.map(t => (
                    <div key={t.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-semibold">{t.name}</div>
                                <div className="text-sm text-neutral-600">{t.game} • {t.date} • {t.location}</div>
                            </div>
                            <Button variant="outline">View</Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}


