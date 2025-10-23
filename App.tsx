

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useApp } from './hooks/useApp';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { ConversationTurn } from './types';
import { getConversationHistory } from './services/firebaseService';

import SideNav from './components/SideNav';
import FloatingActionButton from './components/FloatingActionButton';
import LocationPermissionBanner from './components/LocationPermissionBanner';
import ErrorBoundary from './components/ErrorBoundary';

const HomePage = lazy(() => import('./components/HomePage'));
const SocialBuzzPage = lazy(() => import('./components/SocialBuzzPage'));
const HistoryPage = lazy(() => import('./components/HistoryPage'));
const MarketplacePage = lazy(() => import('./components/MarketplacePage'));
const ChatRoomsPage = lazy(() => import('./components/ChatRoomsPage'));
const SettingsPage = lazy(() => import('./components/SettingsPage'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const EventsPage = lazy(() => import('./components/EventsPage'));
const LocalServicesPage = lazy(() => import('./components/LocalServicesPage'));
const AssistantPage = lazy(() => import('./components/AssistantPage'));


export type Page = 'home' | 'assistant' | 'socialBuzz' | 'history' | 'marketplace' | 'chatRooms' | 'settings' | 'events' | 'localServices';

const App: React.FC = () => {
    const { user, voice, language } = useApp();
    const [currentPage, setCurrentPage] = useState<Page>('home');
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
    const [geolocationError, setGeolocationError] = useState<GeolocationPositionError | null>(null);
    const [isLocationBannerDismissed, setIsLocationBannerDismissed] = useState(false);

    const [conversationHistory, setConversationHistory] = useState<ConversationTurn[] | null>(null);
    const [isHistoryLoading, setIsHistoryLoading] = useState(true);

    useEffect(() => {
        if (user) {
            setIsHistoryLoading(true);
            getConversationHistory(user.uid).then(loadedHistory => {
                setConversationHistory(loadedHistory);
                setIsHistoryLoading(false);
            });
        }
    }, [user]);
    
    const navigateTo = (page: Page) => {
        setCurrentPage(page);
        setIsNavOpen(false);
    };

    const { 
        isConnecting, 
        isConnected, 
        isSpeaking, 
        isReceivingText,
        conversation, 
        startSession, 
        stopSession,
        sendTextMessage
    } = useVoiceAssistant(user, voice, language, currentLocation, conversationHistory, navigateTo);

    useEffect(() => {
      if (!navigator.geolocation) {
        console.error("Geolocation is not supported by this browser.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
            setCurrentLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
            setGeolocationError(null);
        },
        (error) => {
            if (error.code !== 1) console.error(`Geolocation error (${error.code}): ${error.message}`);
            setCurrentLocation(null);
            setGeolocationError(error);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );
    }, []);

    useEffect(() => {
        if (currentPage === 'assistant' && !isConnected && !isConnecting && !isHistoryLoading) {
            startSession();
        } else if (currentPage !== 'assistant' && (isConnected || isConnecting)) {
            stopSession(true);
        }
    }, [currentPage, isConnected, isConnecting, startSession, stopSession, isHistoryLoading]);
    
    if (!user) {
        return <Suspense fallback={<div />}><LoginPage /></Suspense>;
    }
    
    const renderPage = () => {
        const pageProps = { onNavigate: navigateTo, openNav: () => setIsNavOpen(true) };
        switch(currentPage) {
            case 'home': return <HomePage {...pageProps} />;
            case 'socialBuzz': return <SocialBuzzPage {...pageProps} />;
            case 'history': return <HistoryPage {...pageProps} />;
            case 'marketplace': return <MarketplacePage {...pageProps} />;
            case 'chatRooms': return <ChatRoomsPage {...pageProps} />;
            case 'settings': return <SettingsPage {...pageProps} />;
            case 'events': return <EventsPage {...pageProps} />;
            case 'localServices': return <LocalServicesPage {...pageProps} location={currentLocation} geolocationError={geolocationError} />;
            case 'assistant':
                if (isHistoryLoading) {
                    return <div className="flex-1 flex justify-center items-center bg-base-dark-100"><div className="w-12 h-12 border-4 border-current/20 border-t-secondary rounded-full animate-spin"></div></div>;
                }
                return (
                    <AssistantPage
                        conversation={conversation}
                        isConnecting={isConnecting}
                        isConnected={isConnected}
                        isSpeaking={isSpeaking}
                        isReceivingText={isReceivingText}
                        onExit={() => navigateTo('home')}
                        sendTextMessage={sendTextMessage}
                        startSession={startSession}
                    />
                );
            default:
                return <HomePage {...pageProps} />;
        }
    }
    
    const shouldShowLocationBanner = geolocationError?.code === 1 && !isLocationBannerDismissed && currentPage !== 'localServices' && currentPage !== 'assistant';

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-base-100 dark:bg-base-dark-100 text-base-content dark:text-base-content-dark font-sans flex">
            <SideNav isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} onNavigate={navigateTo} currentPage={currentPage} />
            <div className="flex-1 flex flex-col transition-transform duration-300" style={{ transform: isNavOpen ? 'translateX(256px)' : 'translateX(0)' }}>
                {shouldShowLocationBanner && (
                    <LocationPermissionBanner onDismiss={() => setIsLocationBannerDismissed(true)} />
                )}
                <div key={currentPage} className="flex-1 flex flex-col animate-page-fade-in">
                    <ErrorBoundary>
                        <Suspense fallback={<div className="flex-1 flex justify-center items-center"><div className="w-12 h-12 border-4 border-current/20 border-t-secondary rounded-full animate-spin"></div></div>}>
                            {renderPage()}
                        </Suspense>
                    </ErrorBoundary>
                </div>
            </div>
            {currentPage !== 'assistant' && <FloatingActionButton onClick={() => navigateTo('assistant')} />}
        </div>
    );
};

export default App;