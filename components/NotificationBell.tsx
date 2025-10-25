

import React from 'react';
import { useNotifications } from '../hooks/useNotifications';

const NotificationIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;

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

const NotificationBell: React.FC = () => {
    const { unreadCount } = useNotifications();

    return (
        <button className="ripple-container relative p-2 rounded-full hover:bg-base-300/50 dark:hover:bg-base-dark-300/50 transition-transform active:scale-95" onClick={createRipple}>
            <NotificationIcon />
            {unreadCount > 0 && (
                <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-accent text-white text-xs flex items-center justify-center ring-2 ring-base-100 dark:ring-base-dark-100">
                    {unreadCount}
                </span>
            )}
        </button>
    );
};

export default NotificationBell;