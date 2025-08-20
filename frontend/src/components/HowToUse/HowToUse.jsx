import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card.jsx'

function HowToUse({ steps }) {
    return (
        <section id="how-it-works" className="py-16 sm:py-24 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-12 text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">How it works</h2>
                    <p className="mt-2 text-neutral-600">Three quick steps to meet your next offline teammate.</p>
                    <div className="mt-6">
                        <a href="#signup" className="inline-flex items-center justify-center rounded-md bg-black text-white hover:bg-neutral-900 px-4 py-2 text-sm font-medium transition">Explore Now</a>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {steps.map((step, index) => (
                        <Card key={index} className="group hover:border-neutral-300 transition">
                            <CardHeader>
                                <CardTitle>
                                    <div className="flex items-center gap-3">
                                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-lg">{step.icon}</div>
                                        <span>{index + 1}. {step.title}</span>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-neutral-600">{step.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default HowToUse


