import React from 'react';

interface LighthouseIconAnimatedProps {
    className?: string;
    isAnimatedLightSweep?: boolean; // Controls if the light sweep animation is always on or hover-based
    isFloating?: boolean; // Controls if the icon has the float animation
}

const LighthouseIconAnimated: React.FC<LighthouseIconAnimatedProps> = ({ className = 'w-48 h-48', isAnimatedLightSweep = true, isFloating = false }) => (
    <div className={`group ${isFloating ? 'animate-float' : ''}`} style={{ perspective: '500px' }}>
        <svg viewBox="0 0 64 64" className={`w-full h-full ${className}`}>
            <defs>
                <linearGradient id="lighthouse-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#F8F8F8" />
                    <stop offset="100%" stopColor="#E0E0E0" />
                </linearGradient>
                {/* New gradient for the light beam for a softer edge */}
                <linearGradient id="light-beam-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* Back Layer */}
            <g style={{ transform: 'translateZ(-2px)' }} opacity="0.6">
                <path fill="#252A4A" d="M22 24 L20 62 L44 62 L42 24 Z" />
            </g>
            {/* Main Structure with pulsating glow */}
            <g style={{ transform: 'translateZ(0px)' }} className="animate-[lighthouse-body-glow_4s_ease-in-out_infinite]">
                <path fill="url(#lighthouse-grad)" d="M24 24 L22 62 L42 62 L40 24 Z" />
                <path fill="url(#lighthouse-grad)" d="M20 20 H 44 L 42 24 H 22 Z" />
                <path fill="#1B1F3B" d="M28 2 H 36 L 40 20 H 24 Z" />
                <rect x="26" y="4" width="12" height="14" fill="url(#lighthouse-grad)" opacity="0.8"/>
            </g>
            {/* Light Beam with gradient fill and blur */}
            <g style={{ transform: 'translateZ(2px)', transformOrigin: '32px 2px' }} className={isAnimatedLightSweep ? 'animate-[sweep-light_3s_ease-in-out_infinite]' : 'group-hover:animate-[sweep-light_3s_ease-in-out_infinite]'}>
                <path 
                    fill="url(#light-beam-grad)" 
                    className="text-accent" 
                    d="M32 2 L 20 20 H 44 Z" // Wider and longer path for the beam
                    filter="url(#light-beam-blur)" // Apply blur for diffusion
                />
            </g>
            {/* Define a blur filter for the light beam */}
            <filter id="light-beam-blur">
                <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
            </filter>
        </svg>
    </div>
);

export default LighthouseIconAnimated;