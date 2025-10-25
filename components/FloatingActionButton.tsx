import React from 'react';

interface FloatingActionButtonProps {
  onClick: () => void;
}

const LighthouseIcon: React.FC = () => (
    <svg viewBox="0 0 64 64" className="w-10 h-10" style={{ transformStyle: 'preserve-3d' }}>
      <defs>
        <linearGradient id="fab-grad-icon" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F8F8F8" />
            <stop offset="100%" stopColor="#E0E0E0" />
        </linearGradient>
      </defs>
      {/* Back Layer */}
      <g style={{ transform: 'translateZ(-2px)' }} opacity="0.6">
        <path fill="#252A4A" d="M22 24 L20 62 L44 62 L42 24 Z" />
      </g>
      {/* Main Structure */}
      <g style={{ transform: 'translateZ(0px)' }}>
        <path fill="url(#fab-grad-icon)" d="M24 24 L22 62 L42 62 L40 24 Z" />
        <path fill="url(#fab-grad-icon)" d="M20 20 H 44 L 42 24 H 22 Z" />
        <path fill="#1B1F3B" d="M28 2 H 36 L 40 20 H 24 Z" />
        <rect x="26" y="4" width="12" height="14" fill="url(#fab-grad-icon)" opacity="0.8"/>
      </g>
      {/* Light Beam */}
      <g style={{ transform: 'translateZ(2px)', transformOrigin: '32px 2px' }} className="group-hover:[animation:sweep-light_3s_ease-in-out_infinite]">
        <path fill="currentColor" className="text-accent" d="M32 2 L 28 8 H 36 Z" />
      </g>
    </svg>
);

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick }) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${e.clientY - button.getBoundingClientRect().top - radius}px`;
    circle.classList.add("ripple");

    const ripple = button.getElementsByClassName("ripple")[0];
    if (ripple) {
        ripple.remove();
    }
    button.appendChild(circle);
    onClick();
  };

  return (
    <button
        onClick={handleClick}
        className="ripple-container fixed bottom-6 right-6 w-16 h-16 rounded-full flex items-center justify-center shadow-lg focus:outline-none z-20 animate-float group tilt-card transition-all duration-400 ease-in-out shadow-[0_0_25px_theme(colors.primary/0.7)] hover:shadow-[0_0_40px_theme(colors.secondary/0.8)]"
        style={{ 
            perspective: '200px'
        }}
        aria-label="Start conversation with Alex"
    >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-base-dark-100 opacity-90"></div>
        <span className="relative">
            <LighthouseIcon />
        </span>
    </button>
  );
};

export default FloatingActionButton;