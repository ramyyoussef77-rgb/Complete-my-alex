
import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import { useTranslations, VOICES } from '../hooks/useTranslations';
// FIX: Changed import to named import as Header is now a named export
import { Header } from './Header';

interface SettingsPageProps {
  openNav: () => void;
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

const SettingsPage: React.FC<SettingsPageProps> = ({ openNav }) => {
    const { 
        user, 
        logout,
        tempTheme, setTempTheme,
        tempLanguage, setTempLanguage,
        tempVoice, setTempVoice,
        saveSettings,
        resetTempSettings
    } = useApp();
    const t = useTranslations();
    const [showSavedMessage, setShowSavedMessage] = useState(false);

    useEffect(() => {
        resetTempSettings();
    }, [resetTempSettings]);

    const handleSave = (e: React.MouseEvent<HTMLButtonElement>) => {
        createRipple(e);
        saveSettings();
        setShowSavedMessage(true);
        setTimeout(() => {
            setShowSavedMessage(false);
        }, 2000);
    };

    const handleLogout = (e: React.MouseEvent<HTMLButtonElement>) => {
        createRipple(e);
        logout();
    };

    return (
        <div className="relative flex-1 w-full bg-base-100 dark:bg-base-dark-100 text-base-content dark:text-base-content-dark flex flex-col">
            <Header openNav={openNav} />

            <main className="flex-1 overflow-y-auto pt-20 p-4 space-y-8">
                {/* Profile Section */}
                <section>
                    <h2 className="text-lg font-bold text-primary dark:text-secondary mb-2">{t.profile}</h2>
                    <div className="p-4 bg-base-200 dark:bg-base-dark-200 rounded-lg shadow-md flex items-center">
                        <img src={user?.avatar} alt="User Avatar" className="w-16 h-16 rounded-full" />
                        <div className="ml-4">
                            <p className="font-semibold text-xl">{user?.name}</p>
                            <p className="text-base-content/70 dark:text-base-content-dark/70">{user?.email}</p>
                        </div>
                    </div>
                </section>

                {/* Appearance Section */}
                <section>
                    <h2 className="text-lg font-bold text-primary dark:text-secondary mb-2">{t.appearance}</h2>
                    <div className="p-4 bg-base-200 dark:bg-base-dark-200 rounded-lg shadow-md space-y-4">
                        <div className="flex items-center justify-between">
                            <label htmlFor="theme" className="font-semibold">{t.theme}</label>
                            <div className="flex items-center bg-base-300 dark:bg-base-dark-300 p-1 rounded-full">
                                <button onClick={() => setTempTheme('light')} className={`px-3 py-1 text-sm rounded-full ${tempTheme === 'light' ? 'bg-primary text-base-content-dark' : ''}`}>{t.light}</button>
                                <button onClick={() => setTempTheme('dark')} className={`px-3 py-1 text-sm rounded-full ${tempTheme === 'dark' ? 'bg-primary text-base-content-dark' : ''}`}>{t.dark}</button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="language" className="font-semibold">{t.language}</label>
                             <div className="flex items-center bg-base-300 dark:bg-base-dark-300 p-1 rounded-full">
                                <button onClick={() => setTempLanguage('en')} className={`px-3 py-1 text-sm rounded-full ${tempLanguage === 'en' ? 'bg-primary text-base-content-dark' : ''}`}>English</button>
                                <button onClick={() => setTempLanguage('ar')} className={`px-3 py-1 text-sm rounded-full ${tempLanguage === 'ar' ? 'bg-primary text-base-content-dark' : ''}`}>العربية</button>
                            </div>
                        </div>
                    </div>
                </section>
                
                 {/* AI Settings Section */}
                <section>
                    <h2 className="text-lg font-bold text-primary dark:text-secondary mb-2">{t.ai_settings}</h2>
                    <div className="p-4 bg-base-200 dark:bg-base-dark-200 rounded-lg shadow-md">
                         <div className="flex items-center justify-between">
                            <label htmlFor="ai-voice" className="font-semibold">{t.ai_voice}</label>
                             <select id="ai-voice" value={tempVoice} onChange={e => setTempVoice(e.target.value)} className="bg-base-300 dark:bg-base-dark-300 border border-base-300 dark:border-base-dark-300 rounded-md p-2">
                                {VOICES.map(v => <option key={v.value} value={v.value}>{v.name}</option>)}
                             </select>
                         </div>
                    </div>
                </section>

                {/* Save and Logout Section */}
                <section className="space-y-4">
                     <button onClick={handleSave} className="ripple-container w-full py-3 bg-secondary text-base-dark-100 font-bold rounded-lg hover:opacity-90 transition-opacity active:scale-95">
                        {t.save_options}
                    </button>
                    {showSavedMessage && <p className="text-green-400 text-center text-sm animate-pulse">{t.settings_saved}</p>}
                    <button onClick={handleLogout} className="ripple-container w-full py-3 bg-accent text-white font-bold rounded-lg hover:bg-red-600 transition-colors active:scale-95">
                        {t.logout}
                    </button>
                </section>
            </main>
        </div>
    );
};

export default SettingsPage;
