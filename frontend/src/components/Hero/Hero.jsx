import React from 'react'
import { Button } from '../../components/ui/button.jsx'

function Hero({ content }) {
    return (
        <section className="relative overflow-hidden bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                    <div>
                        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900">
                            {content.title}
                        </h1>
                        <p className="mt-4 text-base sm:text-lg text-neutral-600">
                            {content.description}
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button asChild>
                                <a href={content.primaryCta.href}>{content.primaryCta.label}</a>
                            </Button>
                            <Button variant="outline" asChild>
                                <a href={content.secondaryCta.href}>{content.secondaryCta.label}</a>
                            </Button>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="relative aspect-video w-full rounded-xl border border-neutral-200 bg-white p-1 shadow-sm">
                            <div className="h-full w-full rounded-lg bg-neutral-50 grid grid-cols-3 gap-2 p-3">
                                <div className="col-span-2 rounded-md bg-white border border-neutral-200 flex items-center justify-center text-neutral-700 text-sm">
                                    Local Co-op Finder
                                </div>
                                <div className="rounded-md bg-white border border-neutral-200 grid grid-rows-3 gap-2 p-2 text-xs text-neutral-700">
                                    <div className="rounded bg-neutral-100 flex items-center justify-center">🎮 RPG</div>
                                    <div className="rounded bg-neutral-100 flex items-center justify-center">🕹️ Arcade</div>
                                    <div className="rounded bg-neutral-100 flex items-center justify-center">👥 Co-op</div>
                                </div>
                                <div className="col-span-3 rounded-md bg-white border border-neutral-200 flex items-center justify-center text-neutral-700 text-sm">
                                    Meet, match, play.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Hero


