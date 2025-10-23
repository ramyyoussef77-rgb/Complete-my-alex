import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { LocalService } from '../types';
import ServiceCard from './ServiceCard';
import { useTranslations } from '../hooks/useTranslations';
import Header from './Header';
import { SkeletonCard } from './SkeletonLoader';
import InteractiveMapView from './InteractiveMapView';
import ServiceDetailModal from './ServiceDetailModal';

interface LocalServicesPageProps {
  openNav: () => void;
  location: { latitude: number; longitude: number } | null;
  geolocationError: GeolocationPositionError | null;
}

const CATEGORIES = ['restaurants', 'hospitals', 'pharmacies', 'atms', 'hotels', 'electricians', 'plumbers', 'mechanics', 'gas_stations', 'fawry_payments', 'mobile_carriers', 'tv_repair'];
const CATEGORY_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const LocalServicesPage: React.FC<LocalServicesPageProps> = ({ openNav, location, geolocationError }) => {
  const t = useTranslations();
  const [services, setServices] = useState<LocalService[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [openNow, setOpenNow] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const performSearch = useCallback(async (query: string, isCategorySearch: boolean) => {
    if (!query.trim() || !location) {
      if (!location) setError(t.error_local_services);
      return;
    }

    // Check cache for category searches
    const cacheKey = `services_${query.replace(/\s/g, '_')}`;
    if (isCategorySearch) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < CATEGORY_CACHE_TTL) {
          setServices(data);
          // Optional: revalidate in the background, for now we just use cache
        }
      }
    }
    
    setIsLoading(true);
    setError(null);
    setServices([]);
    setSuggestion(null);
    
    try {
      if (!process.env.API_KEY) throw new Error("API key is not configured.");
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Find "${query}" ${openNow ? 'that are currently open' : ''} near latitude ${location.latitude} and longitude ${location.longitude} in Alexandria, Egypt.
        Respond ONLY with a valid JSON array of objects.
        Each object must have all the following keys: "name"(string), "address"(string), "phone"(string), "url"(string), "category"(string), "coordinates"({ "lat": number, "lng": number }), "distance"(string), "starRating"(number, null if none), "priceLevel"(string e.g., "$$"), "isOpenNow"(boolean), "openingHours"([{ "day": string, "hours": string }]), "reviewSummary"(string), "photoUrls"(string[]).
        If no results, return an empty JSON array: [].`;

      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { tools: [{ googleMaps: {} }] }, toolConfig: { retrievalConfig: { latLng: location }}});
      const sanitizedText = response.text.trim().replace(/^```json\s*|```$/g, '');
      const parsedServices = JSON.parse(sanitizedText);
      
      if (Array.isArray(parsedServices)) {
        const servicesWithIds = parsedServices.map((s: Omit<LocalService, 'id'>) => ({ ...s, id: `${s.name}-${Math.random()}`}));
        setServices(servicesWithIds);

        if (servicesWithIds.length === 0) {
            setError(`${t.no_results_found} "${query}"`);
            const suggestionPrompt = `A user searched for "${query}" and found no results. Suggest a correction for a likely misspelling. Respond with a JSON object: {"suggestion": "corrected_term"}. If no suggestion, {"suggestion": ""}.`;
            const suggestionResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: suggestionPrompt });
            const suggestionText = suggestionResponse.text.trim().replace(/^```json\s*|```$/g, '');
            const parsedSuggestion = JSON.parse(suggestionText);
            if(parsedSuggestion.suggestion) setSuggestion(parsedSuggestion.suggestion);
        } else if (isCategorySearch) {
          sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: servicesWithIds }));
        }
      } else {
        throw new Error("API did not return a valid array.");
      }
    } catch (e) {
      console.error("Failed to fetch services:", e);
      setError(t.error_local_services);
    } finally {
      setIsLoading(false);
    }
  }, [location, t, openNow]);

  useEffect(() => {
    const handler = setTimeout(() => {
        setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedQuery) {
        performSearch(debouncedQuery, false);
    }
  }, [debouncedQuery, openNow, performSearch]);

  const handleCategoryClick = (categoryKey: string) => {
    const translatedCategory = t[categoryKey as keyof typeof t] || categoryKey;
    setSearchQuery(''); // Clear text search
    performSearch(translatedCategory, true);
  };
  
  const handleSelectService = (id: string) => {
    setSelectedServiceId(id);
    const element = document.getElementById(`service-card-${id}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  
  const selectedServiceDetails = services?.find(s => s.id === selectedServiceId) || null;

  return (
    <>
      <ServiceDetailModal service={selectedServiceDetails} onClose={() => setSelectedServiceId(null)} />
      <div className="relative flex-1 w-full bg-base-100 dark:bg-base-dark-100 text-base-content dark:text-base-content-dark p-4 pt-20 flex flex-col">
        <Header openNav={openNav} />
        {geolocationError?.code === 1 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center px-4">
            <div className="text-5xl mb-4" aria-hidden="true">🚫</div>
            <h2 className="text-2xl font-bold text-accent">Location Access Denied</h2>
            <p className="mt-2">Please enable location permissions in browser settings to find local services.</p>
          </div>
        ) : (
          <>
          <div className="px-4 space-y-3">
            <div className="relative">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.search_for_service_placeholder} className="w-full pl-4 pr-12 py-3 border border-base-300 dark:border-base-dark-300 rounded-full bg-base-200 dark:bg-base-dark-200"/>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center">
                  <label htmlFor="open-now-toggle" className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" id="open-now-toggle" className="sr-only peer" checked={openNow} onChange={() => setOpenNow(!openNow)} />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                      <span className="ml-3 text-sm font-medium">{t.open_now}</span>
                  </label>
              </div>
              <div className="flex flex-wrap justify-center gap-2 overflow-x-auto pb-2">
                {CATEGORIES.slice(0, 4).map(c => <button key={c} onClick={() => handleCategoryClick(c)} className="px-3 py-1 text-sm rounded-full bg-base-200 dark:bg-base-dark-200">{t[c as keyof typeof t]}</button>)}
              </div>
            </div>
          </div>

          <main className="flex-1 flex flex-col md:flex-row gap-4 pt-4 overflow-hidden">
            <div className="md:w-1/3 h-64 md:h-auto flex-shrink-0">
                <InteractiveMapView services={services || []} selectedServiceId={selectedServiceId} onSelectService={handleSelectService} />
            </div>
            <div ref={listRef} className="flex-1 overflow-y-auto space-y-2 pr-2">
              {isLoading ? (
                [...Array(5)].map((_, i) => <SkeletonCard key={i} className="h-24" />)
              ) : error ? (
                <div className="flex flex-col justify-center items-center h-full text-center">
                  <p className="text-accent">{error}</p>
                  {suggestion && (
                    <button onClick={() => { setSearchQuery(suggestion); performSearch(suggestion, false); }} className="mt-2 text-sm">
                      {t.did_you_mean} <span className="font-bold underline">{suggestion}</span>
                    </button>
                  )}
                </div>
              ) : services && services.length > 0 ? (
                services.map((service, index) => <div id={`service-card-${service.id}`} key={service.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}><ServiceCard service={service} isSelected={selectedServiceId === service.id} onSelect={() => setSelectedServiceId(service.id)} /></div>)
              ) : (
                <div className="flex justify-center items-center h-full"><p>{t.select_category}</p></div>
              )}
            </div>
          </main>
        </>
        )}
      </div>
    </>
  );
};

export default LocalServicesPage;