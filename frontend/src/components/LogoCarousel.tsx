import React from 'react';

const LogoCarousel: React.FC = () => {
    const games = [
        'Cricket',
        'Football',
        'Basketball',
        'Volleyball',
        'Kabaddi',
        'Hockey',
        'Badminton',
        'Tennis'
    ];

    return (
        <div className="relative overflow-hidden bg-gray-50 py-16">
            {/* Section Header */}
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-hero">
                    Find The Games You Love
                </h2>
            </div>

            <div className="flex animate-scroll">
                {/* First set of games */}
                {games.map((game, index) => (
                    <div key={`first-${index}`} className="flex-shrink-0 mx-8">
                        <div className="text-2xl font-bold text-gray-700 font-nav whitespace-nowrap">
                            {game}
                        </div>
                    </div>
                ))}
                {/* Duplicate set for seamless loop */}
                {games.map((game, index) => (
                    <div key={`second-${index}`} className="flex-shrink-0 mx-8">
                        <div className="text-2xl font-bold text-gray-700 font-nav whitespace-nowrap">
                            {game}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LogoCarousel;
