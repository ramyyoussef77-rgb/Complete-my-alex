import React from 'react';
import { useTranslations } from '../hooks/useTranslations';
import NotificationBell from './NotificationBell';

interface HeaderProps {
    openNav: () => void;
}

const MenuIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;

const createRipple = (event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
    circle.classList.add("ripple");
    const ripple = button.getElementsByClassName("ripple")[0];
    if (ripple) ripple.remove();
    button.appendChild(circle);
};

const Header: React.FC<HeaderProps> = ({ openNav }) => {
    const t = useTranslations();
    
    const handleNavClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        createRipple(e);
        openNav();
    };
    
    return (
         <header className="glassmorphism-enhanced absolute top-0 left-0 right-0 h-16 px-4 flex items-center justify-between z-20 text-base-content-dark">
            {/* Left Side */}
            <div className="flex items-center">
                 <h2 className="text-subtitle font-bold">
                    <span className="text-primary">{t.home_title_ar}</span>
                    <span className="mx-1 text-base-content-dark/50">|</span>
                    <span className="text-base-content-dark">{t.home_title_en}</span>
                </h2>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2">
                <NotificationBell />
                <button onClick={handleNavClick} className="ripple-container p-2 -mr-2 rounded-full hover:bg-white/10 transition-transform active:scale-95" aria-label={t.openMenu}>
                    <MenuIcon />
                </button>
            </div>
        </header>
    );
};

export default Header;