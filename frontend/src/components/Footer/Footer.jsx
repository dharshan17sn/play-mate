import React from 'react'

function Footer({ data }) {
    return (
        <footer id="contact" className="border-t border-neutral-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    <div>
                        <div className="flex items-center gap-2">
                            {/* <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-black text-white font-bold">P</span> */}
                            <span className="text-lg font-semibold text-neutral-900">Playmate</span>
                        </div>
                        <p className="mt-3 text-sm text-neutral-600">
                            Connect with offline gamers based on interests and availability.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold">Social</h4>
                        <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                            {data.socials.map((s, i) => (
                                <li key={i}>
                                    <a href={s.href} target="_blank" rel="noreferrer" className="hover:text-neutral-900 transition">
                                        {s.name} <span className="text-gray-500">{s.handle}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold">Contact</h4>
                        <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                            <li><a className="hover:text-neutral-900" href={`mailto:${data.contact.email}`}>{data.contact.email}</a></li>
                            <li>{data.contact.address}</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-200 pt-6 text-xs text-neutral-500">
                    <p>{data.copyright}</p>
                    <div className="flex items-center gap-4">
                        <a href="#home" className="hover:text-neutral-900">Home</a>
                        <a href="#how-it-works" className="hover:text-neutral-900">How it works</a>
                        <a href="#contact" className="hover:text-neutral-900">Contact</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer


