import React from 'react';
import LighthouseIconAnimated from './LighthouseIconAnimated'; // Import the reusable component

interface FloatingActionButtonProps {
  onClick: () => void;
}

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
            {/* Use the reusable LighthouseIconAnimated component */}
            <LighthouseIconAnimated 
                className="w-10 h-10" 
                isAnimatedLightSweep={false} // Light sweep only on group-hover
                isFloating={false} // The parent button already handles the float animation
            />
        </span>
    </button>
  );
};

export default FloatingActionButton;