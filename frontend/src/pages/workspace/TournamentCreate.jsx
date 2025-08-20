import React from 'react'
import { Link } from 'react-router-dom'

export default function TournamentCreate() {
    return (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Create Tournament</h2>
                <Link to="/workspace/tournaments" className="text-sm text-neutral-600 hover:text-neutral-900">Cancel</Link>
            </div>
            <p className="mt-2 text-sm text-neutral-600">Tournament creation form coming next.</p>
        </div>
    )
}


