

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useApp } from './hooks/useApp';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';
import { ConversationTurn } from './types';
import { getConversationHistory } from './services/firebaseService';

import SideNav from './components/SideNav';
import FloatingActionButton from './components/FloatingActionButton';
import LocationPermissionBanner from './components/LocationPermissionBanner';
import ErrorBoundary from './components/ErrorBoundary';
import StatusBar from './components/StatusBar';

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
const DirectoryPage = lazy(() => import('./components/DirectoryPage'));


export type Page = 'home' | 'assistant' | 'socialBuzz' | 'history' | 'marketplace' | 'chatRooms' | 'settings' | 'events' | 'localServices' | 'directory';

const App: React.FC = () => {
    const { user, voice, language, theme } = useApp();
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
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, isConnected, isConnecting, isHistoryLoading]);

    const handleExitAssistant = () => {
        stopSession(true); // true to save history on exit
        navigateTo('home');
    };
    
    if (!user) {
        return <Suspense fallback={<div></div>}><LoginPage /></Suspense>;
    }
    
    const pages = {
        'home': <HomePage onNavigate={navigateTo} openNav={() => setIsNavOpen(true)} />,
        'socialBuzz': <SocialBuzzPage openNav={() => setIsNavOpen(true)} onNavigate={navigateTo}/>,
        'history': <HistoryPage openNav={() => setIsNavOpen(true)} />,
        'marketplace': <MarketplacePage openNav={() => setIsNavOpen(true)} />,
        'chatRooms': <ChatRoomsPage openNav={() => setIsNavOpen(true)} />,
        'settings': <SettingsPage openNav={() => setIsNavOpen(true)} />,
        'events': <EventsPage openNav={() => setIsNavOpen(true)} />,
        'localServices': <LocalServicesPage openNav={() => setIsNavOpen(true)} location={currentLocation} geolocationError={geolocationError} />,
        'directory': <DirectoryPage openNav={() => setIsNavOpen(true)} />,
        'assistant': null
    };

    return (
        <div className={`h-screen w-screen flex flex-col font-sans ${theme}`}>
            <ErrorBoundary>
                <div className="relative h-full w-full flex flex-col bg-base-100 dark:bg-base-dark-100 overflow-hidden">
                    {currentPage === 'assistant' ? (
                        <Suspense fallback={<div className="flex-1"></div>}>
                            <AssistantPage
                                conversation={conversation}
                                isConnecting={isConnecting}
                                isConnected={isConnected}
                                isSpeaking={isSpeaking}
                                isReceivingText={isReceivingText}
                                onExit={handleExitAssistant}
                                sendTextMessage={sendTextMessage}
                                startSession={startSession}
                            />
                        </Suspense>
                    ) : (
                        <>
                           <StatusBar />
                           <SideNav 
                              isOpen={isNavOpen} 
                              onClose={() => setIsNavOpen(false)} 
                              onNavigate={navigateTo}
                              currentPage={currentPage}
                           />
                           {geolocationError?.code === 1 && !isLocationBannerDismissed && <LocationPermissionBanner onDismiss={() => setIsLocationBannerDismissed(true)} />}
                           <Suspense fallback={<div className="flex-1 pt-16 p-4">Loading...</div>}>
                               {pages[currentPage]}
                           </Suspense>
                           <FloatingActionButton onClick={() => navigateTo('assistant')} />
                        </>
                    )}
                </div>
            </ErrorBoundary>
        </div>
    );
};

export default App;
