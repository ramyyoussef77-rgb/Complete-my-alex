
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { LocalEvent } from '../types';
import EventCard from './EventCard';
import { useTranslations } from '../hooks/useTranslations';
// FIX: Changed import to named import as Header is now a named export
import { Header } from './Header';
import { useApp } from '../hooks/useApp';
import { useAutoTranslator } from '../hooks/useAutoTranslator';
import { SkeletonImageCard } from './SkeletonLoader';
import CalendarView from './CalendarView';
import InteractiveMapView from './InteractiveMapView';
import EventAnalysisModal from './EventAnalysisModal';
// FIX: Added import for ServiceCard, as its content was mistakenly in this file.
import ServiceCard from './ServiceCard';

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
        Find a diverse list of 15 upcoming local events in Alexandria, Egypt. Prioritize official events from http://www.alexandria.gov.eg/events.
        Respond ONLY with a valid JSON array of objects.
        Each object must have: "name"(string), "date"(human-readable string), "location"(string), "description"(string), "url"(string), "category"(one of 'Music', 'Art', 'Food', 'Sports', 'Community', 'Other'), "coordinates"({"lat": number, "lng": number}), "startDate"(ISO 8601 string), "endDate"(ISO 8601 string), "imagePrompt"(string for an image model).`;
      
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { tools: [{ googleSearch: {} }, { googleMaps: {} }] } });
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
          startOfWeekend.setDate(startOfWeekend.getDate() + (5 - dayOfWeek)); // Assuming Friday is start of weekend
          const endOfWeekend = new Date(startOfWeekend);
          endOfWeekend.setDate(endOfWeekend.getDate() + 2);
          return eventDate >= startOfWeekend && eventDate < endOfWeekend;
        case 'month':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          return eventDate >= startOfMonth && eventDate <= endOfMonth;
        case 'all':
        default:
          return true;
      }
    });
  }, [translatedEvents, filters, selectedCalendarDate]);

  const handleAddToCalendar = (event: LocalEvent) => {
    const title = encodeURIComponent(event.name);
    const details = encodeURIComponent(event.description);
    const location = encodeURIComponent(event.location);
    const startDate = new Date(event.startDate!).toISOString().replace(/-|:|\.\d\d\d/g,"");
    const endDate = new Date(event.endDate!).toISOString().replace(/-|:|\.\d\d\d/g,"");
    
    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
    window.open(googleCalendarUrl, '_blank');
  };

  const isLoading = isInitialLoading || (isRevalidating && !events);

  return (
    <>
      <EventAnalysisModal event={eventToAnalyze} onClose={() => setEventToAnalyze(null)} />
      <div className="relative flex-1 w-full bg-base
