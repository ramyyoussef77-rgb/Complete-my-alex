
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { LocalEvent } from '../types';
import EventCard from './EventCard';
import { useTranslations } from '../hooks/useTranslations';
import Header from './Header';
import { useApp } from '../hooks/useApp';
import { useAutoTranslator } from '../hooks/useAutoTranslator';
import { SkeletonImageCard } from './SkeletonLoader';
import CalendarView from './CalendarView';
import InteractiveMapView from './InteractiveMapView';
import EventAnalysisModal from './EventAnalysisModal';

interface EventsPageProps {
  openNav: () => void;
}

type ViewMode = 'list' | 'calendar' | 'map';
type DateFilter = 'all' | 'today' | 'weekend' | 'month';

const EVENTS_CACHE_KEY = 'eventsPageCache';
const EVENTS_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

async function generateEventImage(prompt: string): Promise<string | null> {
  try {
    if (!process.env.API_KEY) return null;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `A vibrant, exciting, artistic image for an event. ${prompt}` }] },
      config: { responseModalities: [Modality.IMAGE] },
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : null;
  } catch (e) {
    console.error("Event image generation failed:", e);
    return null;
  }
}

const EventsPage: React.FC<EventsPageProps> = ({ openNav }) => {
  const { contentVersion } = useApp();
  const t = useTranslations();
  const [events, setEvents] = useState<LocalEvent[] | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filters, setFilters] = useState({
    category: 'all',
    date: 'all' as DateFilter,
    search: '',
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventToAnalyze, setEventToAnalyze] = useState<LocalEvent | null>(null);

  const { translatedData: translatedEvents } = useAutoTranslator(events);

  const fetchEvents = useCallback(async () => {
    setIsRevalidating(true);
    setError(null);

    const cached = localStorage.getItem(EVENTS_CACHE_KEY);
    if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < EVENTS_CACHE_TTL) {
            setEvents(data);
            setIsInitialLoading(false);
        }
    }

    try {
      if (!process.env.API_KEY) throw new Error("API key is not configured.");
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Find a diverse list of 15 upcoming local events in Alexandria, Egypt.
        Respond ONLY with a valid JSON array of objects.
        Each object must have: "name"(string), "date"(human-readable string), "location"(string), "description"(string), "url"(string), "category"(one of 'Music', 'Art', 'Food', 'Sports', 'Community', 'Other'), "coordinates"({"lat": number, "lng": number}), "startDate"(ISO 8601 string), "endDate"(ISO 8601 string), "imagePrompt"(string for an image model).`;
      
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { tools: [{ googleSearch: {} }] } });
      const sanitizedText = response.text.trim().replace(/^```json\s*|```$/g, '');
      const parsedEvents = JSON.parse(sanitizedText);
      
      if (Array.isArray(parsedEvents)) {
        const eventsWithImages = await Promise.all(
            parsedEvents.map(async (event: any) => ({
                ...event,
                imageUrl: await generateEventImage(event.imagePrompt),
            }))
        );
        setEvents(eventsWithImages);
        localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: eventsWithImages }));
      } else {
        throw new Error("API did not return a valid array.");
      }
    } catch (e) {
      console.error("Failed to fetch events:", e);
      setError(t.error_local_events);
    } finally {
      setIsInitialLoading(false);
      setIsRevalidating(false);
    }
  }, [t.error_local_events]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, contentVersion]);

  const filteredEvents = useMemo(() => {
    if (!translatedEvents) return [];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return translatedEvents.filter(event => {
      const eventDate = event.startDate ? new Date(event.startDate) : new Date();

      if (filters.category !== 'all' && event.category !== filters.category) return false;
      if (filters.search && !event.name.toLowerCase().includes(filters.search.toLowerCase()) && !event.description.toLowerCase().includes(filters.search.toLowerCase())) return false;

      if (selectedCalendarDate) {
        const startOfSelected = new Date(selectedCalendarDate.getFullYear(), selectedCalendarDate.getMonth(), selectedCalendarDate.getDate());
        const endOfSelected = new Date(startOfSelected);
        endOfSelected.setDate(endOfSelected.getDate() + 1);
        return eventDate >= startOfSelected && eventDate < endOfSelected;
      }

      switch (filters.date) {
        case 'today':
          const endOfToday = new Date(startOfToday);
          endOfToday.setDate(endOfToday.getDate() + 1);
          return eventDate >= startOfToday && eventDate < endOfToday;
        case 'weekend':
          const dayOfWeek = now.getDay();
          const startOfWeekend = new Date(startOfToday);
          startOfWeekend.setDate(startOfWeekend.getDate() - dayOfWeek + 5); // Assuming Fri is start
          const endOfWeekend = new Date(startOfWeekend);
          endOfWeekend.setDate(endOfWeekend.getDate() + 2);
          return eventDate >= startOfWeekend && eventDate < endOfWeekend;
        case 'month':
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          return eventDate >= startOfToday && eventDate <= endOfMonth;
        default:
          return true;
      }
    });
  }, [translatedEvents, filters, selectedCalendarDate]);

  const handleAddToCalendar = (event: LocalEvent) => {
    const formatICSDate = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, "");
    const startDate = event.startDate ? new Date(event.startDate) : new Date();
    const endDate = event.endDate ? new Date(event.endDate) : new Date(startDate.getTime() + 60 * 60 * 1000);

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:${Date.now()}@myalexapp.com
SUMMARY:${event.name}
DESCRIPTION:${event.description}\\nURL: ${event.url}
LOCATION:${event.location}
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.name}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const handleDateFilterChange = (filter: DateFilter) => {
    setSelectedCalendarDate(null);
    setFilters(f => ({...f, date: filter }));
  }

  const handleCalendarDateSelect = (date: Date | null) => {
    setFilters(f => ({ ...f, date: 'all' }));
    setSelectedCalendarDate(date);
    setViewMode('list');
  };

  const CATEGORIES = ['Music', 'Art', 'Food', 'Sports', 'Community', 'Other'];
  const DATE_FILTERS: {key: DateFilter, label: string}[] = [{key: 'all', label: t.date_all}, {key: 'today', label: t.date_today}, {key: 'weekend', label: t.date_weekend}, {key: 'month', label: t.date_month}];

  const renderContent = () => {
    if (isInitialLoading) {
      return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"><{[...Array(8)].map((_, i) => <SkeletonImageCard key={i} />)}</div>;
    }
    if (error) {
      return <div className="flex justify-center items-center h-full"><p className="text-center text-accent">{error}</p></div>;
    }

    if (viewMode === 'list') {
      if (filteredEvents.length === 0) return <div className="flex justify-center items-center h-full"><p>{t.no_events_found}</p></div>
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEvents.map((event, index) => (
            <div key={`${event.name}-${index}`} className="animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
              <EventCard event={event} onAddToCalendar={() => handleAddToCalendar(event)} onAnalyze={() => setEventToAnalyze(event)} />
            </div>
          ))}
        </div>
      );
    }
    if (viewMode === 'calendar') {
      return <CalendarView events={translatedEvents || []} onDateSelect={handleCalendarDateSelect} />;
    }
    if (viewMode === 'map') {
        const eventsWithCoords = (translatedEvents || []).filter(e => e.coordinates);
        return <div className="h-[calc(100vh-20rem)]"><InteractiveMapView services={eventsWithCoords.map(e => ({...e, id: e.name})) as any} selectedServiceId={selectedEventId} onSelectService={setSelectedEventId} /></div>
    }
  };

  return (
    <>
      <EventAnalysisModal event={eventToAnalyze} onClose={() => setEventToAnalyze(null)} />
      <div className="relative flex-1 w-full bg-base-dark-100 text-base-content-dark p-4 pt-20 flex flex-col">
        <Header openNav={openNav} />
        
        <div className="space-y-3 mb-4">
          <input type="text" placeholder={t.search_events_placeholder} value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} className="w-full px-4 py-2 border border-base-dark-300 rounded-full bg-base-dark-200 focus:ring-2 focus:ring-secondary"/>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button onClick={() => setFilters(f => ({ ...f, category: 'all' }))} className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap ${filters.category === 'all' ? 'bg-secondary text-base-dark-100' : 'bg-base-dark-200'}`}>{t.all_categories}</button>
                {CATEGORIES.map(c => <button key={c} onClick={() => setFilters(f => ({ ...f, category: c }))} className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap ${filters.category === c ? 'bg-secondary text-base-dark-100' : 'bg-base-dark-200'}`}>{
                  // FIX: Safely construct translation key to avoid implicit conversion errors at runtime.
                  t[`cat_${c.toLowerCase()}` as keyof typeof t] || c
                }</button>)}
            </div>
            <div className="flex items-center gap-2 ml-auto">
                {DATE_FILTERS.map(d => <button key={d.key} onClick={() => handleDateFilterChange(d.key)} className={`px-3 py-1 rounded-full font-semibold whitespace-nowrap ${filters.date === d.key && !selectedCalendarDate ? 'bg-secondary text-base-dark-100' : 'bg-base-dark-200'}`}>{d.label}</button>)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center mb-4 bg-base-dark-200 p-1 rounded-full w-min mx-auto">
            {(['list', 'calendar', 'map'] as ViewMode[]).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)} className={`px-3 py-1 text-sm font-semibold rounded-full capitalize ${viewMode === mode ? 'bg-secondary text-base-dark-100' : ''}`}>{t[`view_${mode}`]}</button>
            ))}
        </div>
        
        <main className="flex-1 overflow-y-auto pr-2">{renderContent()}</main>
      </div>
    </>
  );
};

export default EventsPage;
