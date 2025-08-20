import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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

function Select({ id, label, value, onChange, children }) {
    return (
        <div className="space-y-1">
            <label htmlFor={id} className="block text-sm font-medium text-neutral-700">{label}</label>
            <select
                id={id}
                value={value}
                onChange={onChange}
                className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
            >
                {children}
            </select>
        </div>
    )
}

const offlineGames = [
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
]

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function ProfileCreate() {
    const [photoPreview, setPhotoPreview] = useState('')
    const [name, setName] = useState('')
    const [gender, setGender] = useState('')
    const [location, setLocation] = useState('')
    const [game, setGame] = useState('')
    const [availabilities, setAvailabilities] = useState([])
    const fileInputRef = useRef(null)
    const navigate = useNavigate()

    function onPhotoChange(e) {
        const file = e.target.files && e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => setPhotoPreview(reader.result)
        reader.readAsDataURL(file)
    }

    function addSlot() {
        setAvailabilities(prev => [...prev, { day: '', start: '', end: '' }])
    }
    function removeSlot(index) {
        setAvailabilities(prev => prev.filter((_, i) => i !== index))
    }
    function updateSlot(index, field, value) {
        setAvailabilities(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
    }

    function onSelectGame(e) {
        setGame(e.target.value)
        if (availabilities.length === 0) {
            addSlot()
        }
    }

    function onSubmit(e) {
        e.preventDefault()
        const payload = {
            name,
            gender,
            location,
            game,
            availabilities,
            photo: photoPreview,
        }
        try {
            localStorage.setItem('playmate_profile', JSON.stringify(payload))
            navigate('/profile')
        } catch (err) {
            console.error('Failed to save profile', err)
            alert('Failed to save profile locally. Please try again.')
        }
    }

    return (
        <div className="min-h-screen bg-[#F4F4F4] flex items-start justify-center px-4 py-10">
            <div className="w-full max-w-2xl rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-bold text-neutral-900">Create your profile</h1>
                <p className="mt-1 text-sm text-neutral-600">Add your details and availability to find the perfect match.</p>

                <form onSubmit={onSubmit} className="mt-8 grid grid-cols-1 gap-6">
                    {/* Photo uploader */}
                    <div className="flex flex-col items-center">
                        <label className="block text-sm font-medium text-neutral-700 mb-3 text-center">Profile photo</label>
                        <div className="h-28 w-28 rounded-full bg-neutral-100 border-2 border-dashed border-neutral-300 overflow-hidden flex items-center justify-center">
                            {photoPreview ? (
                                <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-12 w-12 text-neutral-400">
                                    <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" />
                                </svg>
                            )}
                        </div>
                        <input ref={fileInputRef} onChange={onPhotoChange} type="file" accept="image/*" className="hidden" />
                        <div className="mt-3">
                            <Button type="button" onClick={() => fileInputRef.current?.click()}>Upload photo</Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Input id="name" label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="Alex" />
                        <Select id="gender" label="Gender" value={gender} onChange={e => setGender(e.target.value)}>
                            <option value="">Select gender</option>
                            <option>Male</option>
                            <option>Female</option>
                            <option>Non-binary</option>
                            <option>Prefer not to say</option>
                        </Select>
                        <Input id="location" label="Location" value={location} onChange={e => setLocation(e.target.value)} placeholder="City, Area" />
                        <Select id="game" label="Select game" value={game} onChange={onSelectGame}>
                            <option value="">Choose a game</option>
                            {offlineGames.map(g => <option key={g} value={g}>{g}</option>)}
                        </Select>
                    </div>

                    {/* Availability slots */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-neutral-700">Preferred days and times</label>
                            <Button type="button" variant="outline" onClick={addSlot}>Add slot</Button>
                        </div>
                        {availabilities.length === 0 && (
                            <p className="text-sm text-neutral-500">Select a game to add availability.</p>
                        )}
                        {availabilities.map((slot, index) => (
                            <div key={index} className="grid grid-cols-1 sm:grid-cols-7 gap-3 items-end">
                                <div className="sm:col-span-3">
                                    <Select id={`day-${index}`} label="Day" value={slot.day} onChange={e => updateSlot(index, 'day', e.target.value)}>
                                        <option value="">Select day</option>
                                        {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
                                    </Select>
                                </div>
                                <div className="sm:col-span-2">
                                    <Input id={`start-${index}`} label="Start time" type="time" value={slot.start} onChange={e => updateSlot(index, 'start', e.target.value)} />
                                </div>
                                <div className="sm:col-span-2">
                                    <Input id={`end-${index}`} label="End time" type="time" value={slot.end} onChange={e => updateSlot(index, 'end', e.target.value)} />
                                </div>
                                <div className="sm:col-span-7">
                                    <Button type="button" variant="outline" className="mt-1" onClick={() => removeSlot(index)}>Remove</Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4">
                        <Button type="submit" className="w-full">Submit profile</Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
