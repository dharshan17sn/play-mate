import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function ProfileView() {
    const navigate = useNavigate()
    let data
    try {
        const raw = localStorage.getItem('playmate_profile')
        data = raw ? JSON.parse(raw) : null
    } catch (e) {
        data = null
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center px-4">
                <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 text-center">
                    <p className="text-sm text-neutral-600">No profile found.</p>
                    <div className="mt-4">
                        <Link to="/profile/create" className="text-sm font-medium text-neutral-900 hover:underline">Create profile</Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F4F4F4] flex items-start justify-center px-4 py-10">
            <div className="w-full max-w-2xl rounded-xl border border-neutral-200 bg-white p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-neutral-900">Your Profile</h1>
                    <button onClick={() => navigate('/workspace')} className="text-sm text-neutral-600 hover:text-neutral-900">Back to home</button>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="sm:col-span-1">
                        <div className="h-32 w-32 rounded-full bg-neutral-100 border border-neutral-200 overflow-hidden flex items-center justify-center">
                            {data.photo ? (
                                <img src={data.photo} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-14 w-14 text-neutral-400">
                                    <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-5 0-9 2.69-9 6v2h18v-2c0-3.31-4-6-9-6Z" />
                                </svg>
                            )}
                        </div>
                    </div>
                    <div className="sm:col-span-2 space-y-3">
                        <div>
                            <div className="text-sm text-neutral-500">Name</div>
                            <div className="font-medium">{data.name || '-'}</div>
                        </div>
                        <div>
                            <div className="text-sm text-neutral-500">Gender</div>
                            <div className="font-medium">{data.gender || '-'}</div>
                        </div>
                        <div>
                            <div className="text-sm text-neutral-500">Location</div>
                            <div className="font-medium">{data.location || '-'}</div>
                        </div>
                        <div>
                            <div className="text-sm text-neutral-500">Preferred game</div>
                            <div className="font-medium">{data.game || '-'}</div>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <div className="text-sm text-neutral-500 mb-2">Availability</div>
                    {!data.availabilities || data.availabilities.length === 0 ? (
                        <p className="text-sm text-neutral-600">No availability set.</p>
                    ) : (
                        <ul className="list-disc pl-6 text-sm text-neutral-700 space-y-1">
                            {data.availabilities.map((s, i) => (
                                <li key={i}>{s.day || '-'} {s.start && s.end ? `• ${s.start} - ${s.end}` : ''}</li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="mt-8 flex items-center gap-3">
                    <Link to="/profile/create" className="text-sm text-neutral-600 hover:text-neutral-900">Edit profile</Link>
                    <Link to="/workspace" className="text-sm text-neutral-600 hover:text-neutral-900">Back to home</Link>
                </div>
            </div>
        </div>
    )
}
