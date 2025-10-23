import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { WeatherData, TrafficData, NewsData } from '../types';
import InfoCard from './InfoCard';
import { useApp } from '../hooks/useApp';
import { useTranslations } from '../hooks/useTranslations';
import { Page } from '../App';
import Header from './Header';
import { useAutoTranslator } from '../hooks/useAutoTranslator';
import DailyBriefingCard from './DailyBriefingCard';
import ProTipCard from './ProTipCard';
import AlexandriaInPhotosCard from './AlexandriaInPhotosCard';
import { WeatherChart, TrafficChart } from './DashboardCharts';

const WeatherIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>;
const TrafficIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const NewsIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3h2m-4 3H9m-4 4h2m-4 4h2m4-8h2m-4 4h2m4-4h2m0 4h2" /></svg>;
const HistoryIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const MarketplaceIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const ChatIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const EventsIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
const ServicesIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const DASHBOARD_CACHE_KEY = 'dashboardDataCache';

interface HomePageProps {
  onNavigate: (page: Page) => void;
  openNav: () => void;
}

const HomePageSkeleton = () => (
    <div className="space-y-4 animate-pulse">
        <div className="bg-base-dark-200/50 p-4 rounded-xl shadow-lg h-28"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-base-dark-200/50 p-4 rounded-xl shadow-lg h-24"></div>
            <div className="bg-base-dark-200/50 p-4 rounded-xl shadow-lg h-24"></div>
        </div>
        <div className="bg-base-dark-200/50 p-4 rounded-xl shadow-lg h-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-base-dark-200/50 p-4 rounded-xl shadow-lg h-48"></div>
            <div className="bg-base-dark-200/50 p-4 rounded-xl shadow-lg h-48"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-base-dark-200/50 p-4 rounded-xl shadow-lg h-28"></div>
            ))}
        </div>
    </div>
);

const HomePage: React.FC<HomePageProps> = ({ onNavigate, openNav }) => {
  const { contentVersion } = useApp();
  const t = useTranslations();
  const [dashboardData, setDashboardData] = useState<{weather: WeatherData, traffic: TrafficData, news: NewsData[]} | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { translatedData, isTranslating } = useAutoTranslator(dashboardData);
  const weather = translatedData?.weather;
  const traffic = translatedData?.traffic;
  const news = translatedData?.news;

  const fetchDashboardData = useCallback(async () => {
    setIsRevalidating(true);
    setError(null);
    if (!process.env.API_KEY) {
      setError("API Key not configured.");
      setIsRevalidating(false);
      setIsInitialLoading(false);
      return;
    }
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const model = 'gemini-2.5-flash';
        const prompt = `
        Get the current dashboard information for Alexandria, Egypt.
        Respond ONLY with a single, valid JSON object with three keys: "weather", "traffic", and "news".
        - "weather": Must be an object with two keys: "current" and "forecast".
          - "current" must be an object with "temperature" (string, e.g., '28°C'), "condition" (string, e.g., 'Sunny'), and "location" (string, 'Alexandria').
          - "forecast" must be an array of exactly 3 objects for the next 3 days. Each object must have "day" (string, e.g., "Tomorrow"), "high" (string, e.g., '30°C'), "low" (string, e.g., '22°C'), and "condition" (string, e.g., 'Partly Cloudy').
        - "traffic": An object with an "overallStatus" (string, e.g., "Moderate") and a "roads" key. "roads" must be a JSON array of the 5 main roads in Alexandria. Each object must have "roadName" and "status" (one of 'Heavy', 'Moderate', or 'Light').
        - "news": An array of the 5 latest news headlines for Egypt. Each object must have "headline", "source", and "url".
        `;

        const response = await ai.models.generateContent({ model, contents: prompt, config: { tools: [{ googleSearch: {} }, { googleMaps: {} }] } });
        const sanitizedText = response.text.trim().replace(/^```json\s*|```$/g, '');
        const data = JSON.parse(sanitizedText);
        setDashboardData(data);
        localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            data: data
        }));
    } catch (e) {
      console.error("Failed to fetch dashboard data:", e);
      setError("Failed to load dashboard data.");
    } finally {
      setIsInitialLoading(false);
      setIsRevalidating(false);
    }
  }, []);

  useEffect(() => {
    const cachedItem = localStorage.getItem(DASHBOARD_CACHE_KEY);
    if (cachedItem) {
        const { timestamp, data } = JSON.parse(cachedItem);
        if (Date.now() - timestamp < CACHE_TTL) {
            setDashboardData(data);
            setIsInitialLoading(false);
        }
    }
    fetchDashboardData();
  }, [fetchDashboardData, contentVersion]);
  
  const isCardLoading = isRevalidating || (isTranslating && !!dashboardData);

  return (
    <div className="relative flex-1 w-full bg-base-dark-100 text-base-content-dark p-4 pt-20 flex flex-col overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="aurora-blob w-[600px] h-[500px] bg-primary/30" style={{'--start-x': '-20%', '--start-y': '10%', '--end-x': '40%', '--end-y': '80%'}}></div>
          <div className="aurora-blob w-[500px] h-[500px] bg-secondary/20" style={{'--start-x': '80%', '--start-y': '20%', '--end-x': '20%', '--end-y': '90%', animationDuration: '30s'}}></div>
          <div className="aurora-blob w-[400px] h-[300px] bg-accent/20" style={{'--start-x': '50%', '--start-y': '100%', '--end-x': '100%', '--end-y': '0%', animationDuration: '20s'}}></div>
      </div>
      
      <Header openNav={openNav} />
      
      <main className="flex-1 overflow-y-auto z-10">
        {isInitialLoading ? (
          <HomePageSkeleton />
        ) : (
          <div className="space-y-4" style={{ perspective: '1000px' }}>
              <div className="animate-fade-in-up">
                <DailyBriefingCard />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="animate-fade-in-up" style={{animationDelay: '100ms'}}>
                    <ProTipCard />
                  </div>
                  <div className="animate-fade-in-up" style={{animationDelay: '150ms'}}>
                    <AlexandriaInPhotosCard />
                  </div>
              </div>
              
              <div className="animate-fade-in-up" style={{animationDelay: '200ms'}}>
                  <InfoCard title={t.weather} icon={<WeatherIcon />} isLoading={isCardLoading} error={error} className="h-auto min-h-48">
                      {weather && <WeatherChart weather={weather} />}
                  </InfoCard>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="animate-fade-in-up" style={{animationDelay: '250ms'}}>
                      <InfoCard 
                          title={t.liveTraffic} 
                          icon={<TrafficIcon />} 
                          isLoading={isCardLoading} 
                          error={error}
                          className="h-48"
                      >
                          {traffic && traffic.roads && <TrafficChart traffic={traffic} />}
                      </InfoCard>
                  </div>
                  <div className="animate-fade-in-up" style={{animationDelay: '300ms'}}>
                      <InfoCard 
                          title={t.topNews} 
                          icon={<NewsIcon />} 
                          isLoading={isCardLoading} 
                          error={error} 
                          className="h-48"
                          contentClassName="items-start justify-start p-1"
                      >
                          {news && news.length > 0 && (
                              <div className="w-full h-full overflow-y-auto pr-2">
                                  <ul className="space-y-1 text-left w-full text-sm">
                                      {news.map((item, index) => (
                                          <li key={index}>
                                              <a href={item.url} target="_blank" rel="noopener noreferrer" className="block p-1 rounded hover:bg-black/20">
                                                  <p className="font-semibold line-clamp-2">{item.headline}</p>
                                                  <p className="opacity-70 text-xs">{item.source}</p>
                                              </a>
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          )}
                      </InfoCard>
                  </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="animate-fade-in-up" style={{animationDelay: '350ms'}}><InfoCard title={t.local_services_title} icon={<ServicesIcon />} isLoading={false} error={null} onClick={() => onNavigate('localServices')} className="h-28"><p className="font-semibold">{t.local_services_card_title}</p></InfoCard></div>
                  <div className="animate-fade-in-up" style={{animationDelay: '400ms'}}><InfoCard title={t.events_title} icon={<EventsIcon />} isLoading={false} error={null} onClick={() => onNavigate('events')} className="h-28"><p className="font-semibold">{t.events_card_title}</p></InfoCard></div>
                  <div className="animate-fade-in-up" style={{animationDelay: '450ms'}}><InfoCard title={t.history_title} icon={<HistoryIcon />} isLoading={false} error={null} onClick={() => onNavigate('history')} className="h-28"><p className="font-semibold">{t.history_card_title}</p></InfoCard></div>
                  <div className="animate-fade-in-up" style={{animationDelay: '500ms'}}><InfoCard title={t.marketplace_title} icon={<MarketplaceIcon />} isLoading={false} error={null} onClick={() => onNavigate('marketplace')} className="h-28"><p className="font-semibold">{t.marketplace_card_title}</p></InfoCard></div>
                  <div className="animate-fade-in-up" style={{animationDelay: '550ms'}}><InfoCard title={t.chat_rooms_title} icon={<ChatIcon />} isLoading={false} error={null} onClick={() => onNavigate('chatRooms')} className="h-28"><p className="font-semibold">{t.chat_rooms_card_title}</p></InfoCard></div>
                  <div className="animate-fade-in-up" style={{animationDelay: '600ms'}}><InfoCard title={t.socialBuzz} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} isLoading={false} error={null} onClick={() => onNavigate('socialBuzz')} className="h-28"><p className="font-semibold">{t.social_buzz_title}</p></InfoCard></div>
              </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default React.memo(HomePage);