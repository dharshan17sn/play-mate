import React from 'react'
import { Button } from '../../components/ui/button.jsx'

function Navbar() {
    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-neutral-200">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center">
                    <div className="flex items-center gap-2">
                        <a href="#home" className="text-xl font-black tracking-tight text-black hover:text-neutral-700 transition-colors">Playmate</a>
                    </div>

                    <nav className="mx-auto hidden md:flex items-center gap-8">
                        <a href="/" className="text-sm text-neutral-600 hover:text-neutral-900 transition">Home</a>
                        <a href="#contact" className="text-sm text-neutral-600 hover:text-neutral-900 transition">Contact Us</a>
                    </nav>

                    <div className="ml-auto flex items-center gap-2">
                        <Button variant="outline" asChild>
                            <a href="/signin">Sign In</a>
                        </Button>
                        <Button asChild>
                            <a href="/signup">Get Started</a>
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Navbar

