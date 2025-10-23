import React from 'react';
import { Page } from '../App';
import { useApp } from '../hooks/useApp';
import { useTranslations } from '../hooks/useTranslations';

interface SideNavProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: Page) => void;
  currentPage: Page;
}

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

const NavLink: React.FC<{
    page: Page;
    label: string;
    icon: React.ReactNode;
    currentPage: Page;
    onNavigate: (page: Page) => void;
}> = ({ page, label, icon, currentPage, onNavigate }) => {
    const isActive = currentPage === page;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        createRipple(e);
        onNavigate(page);
    };

    return (
        <button
            onClick={handleClick}
            className={`ripple-container w-full flex items-center px-4 py-3 text-lg rounded-md transition-all duration-300 font-semibold active:scale-95 ${isActive ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg' : 'hover:bg-base-200 dark:hover:bg-base-dark-300'}`}
        >
            <span className="mr-4 transition-transform duration-300 group-hover:scale-110">{icon}</span>
            {label}
        </button>
    );
};

const SideNav: React.FC<SideNavProps> = ({ isOpen, onClose, onNavigate, currentPage }) => {
    const { user } = useApp();
    const t = useTranslations();

    const navItems = [
        { page: 'home' as Page, label: t.home, icon: <span>🏠</span> },
        { page: 'localServices' as Page, label: t.local_services, icon: <span>📍</span> },
        { page: 'events' as Page, label: t.events, icon: <span>🎉</span> },
        { page: 'history' as Page, label: t.history, icon: <span>📜</span> },
        { page: 'marketplace' as Page, label: t.marketplace, icon: <span>🛒</span> },
        { page: 'socialBuzz' as Page, label: t.socialBuzz, icon: <span>🌐</span> },
        { page: 'chatRooms' as Page, label: t.chatRooms, icon: <span>💬</span> },
        { page: 'settings' as Page, label: t.settings, icon: <span>⚙️</span> },
    ];
    
    return (
        <>
            <div
                className={`fixed inset-0 bg-black/60 z-30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            ></div>
            <nav 
                className={`fixed top-0 left-0 h-full w-64 bg-base-100 dark:bg-base-dark-200 shadow-lg z-40 transform transition-transform duration-500`}
                style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)', transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}
            >
                <div className="p-4 border-b border-base-300 dark:border-base-dark-300">
                    {user && (
                        <div className="flex items-center">
                            <img src={user.avatar} alt="User Avatar" className="w-12 h-12 rounded-full" />
                            <div className="ml-3">
                                <p className="font-semibold">{user.name}</p>
                                <p className="text-sm text-base-content/70 dark:text-base-content-dark/70">{user.email}</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-2 space-y-1">
                    {navItems.map(item => (
                        <NavLink key={item.page} {...item} currentPage={currentPage} onNavigate={onNavigate} />
                    ))}
                </div>
            </nav>
        </>
    );
};

export default SideNav;