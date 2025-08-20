import React from 'react'
import './index.css'
import Navbar from './components/Navbar/Navbar.jsx'
import Hero from './components/Hero/Hero.jsx'
import HowToUse from './components/HowToUse/HowToUse.jsx'
import Benefits from './components/Benefits/Benefits.jsx'
import LogoCarousel from './components/Logos/LogoCarousel.jsx'
import Footer from './components/Footer/Footer.jsx'

function App() {
  const heroContent = {
    title: 'Find your next offline co-op partner with Playmate',
    description:
      'Playmate connects local gamers based on interests, platform, and availability. Meet, match, and team up for your next gaming session IRL.',
    primaryCta: { label: 'Get Started', href: '#get-started' },
    secondaryCta: { label: 'Learn More', href: '#how-it-works' },
  }

  const steps = [
    {
      title: 'Create your profile',
      description:
        'Tell us your favorite games, preferred platforms, and when you like to play. You stay in control of what you share.',
      icon: '🎮',
    },
    {
      title: 'Discover nearby players',
      description:
        'We suggest compatible players near you based on interests and schedule. Send invites or save for later.',
      icon: '📍',
    },
    {
      title: 'Match and meet up',
      description:
        'Chat to coordinate, then meet at your favorite spot—cafe, arcade, or a living room couch. Have fun and stay safe.',
      icon: '🤝',
    },
  ]

  const footerData = {
    socials: [
      { name: 'Twitter/X', href: 'https://x.com', handle: '@playmate' },
      { name: 'Instagram', href: 'https://instagram.com', handle: '@playmate' },
      { name: 'Discord', href: 'https://discord.com', handle: 'Join our server' },
    ],
    contact: {
      email: 'hello@playmate.app',
      address: '123 Indie Lane, Gamer City',
    },
    copyright: `© ${new Date().getFullYear()} Playmate. All rights reserved.`,
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F4F4] text-neutral-900">
      <Navbar />
      <main id="home" className="flex-1">
        <Hero content={heroContent} />
        <HowToUse steps={steps} />
        <Benefits />
        <LogoCarousel />
      </main>
      <Footer data={footerData} />
    </div>
  )
}

export default App
