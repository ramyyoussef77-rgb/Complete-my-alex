import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { HistoricalPlace } from '../types';
import HistoryCard from './HistoryCard';
import NarrativeModal from './NarrativeModal';
import { useTranslations } from '../hooks/useTranslations';
import Header from './Header';
import { useApp } from '../hooks/useApp';
import { useAutoTranslator } from '../hooks/useAutoTranslator';
import { SkeletonImageCard } from './SkeletonLoader';
// FIX: Imported custom `decodeAudioData` function to correctly process raw PCM audio.
import { decode, decodeAudioData } from '../services/audioUtils';

interface HistoryPageProps {
  openNav: () => void;
}

const HISTORY_CACHE_KEY = 'historyPageCache';
const HISTORY_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const ERAS = ["All", "Ptolemaic", "Roman", "Ottoman", "Modern"];
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
let currentAudioSource: AudioBufferSourceNode | null = null;

async function generateImage(prompt: string): Promise<string | null> {
  try {
    if (!process.env.API_KEY) return null;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { responseModalities: [Modality.IMAGE] },
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : null;
  } catch (e) {
    console.error("Image generation failed:", e);
    return null;
  }
}

const HistoryPage: React.FC<HistoryPageProps> = ({ openNav }) => {
  const { contentVersion } = useApp();
  const t = useTranslations();
  const [places, setPlaces] = useState<HistoricalPlace[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeEra, setActiveEra] = useState('All');
  const [selectedPlace, setSelectedPlace] = useState<HistoricalPlace | null>(null);
  const [audioState, setAudioState] = useState<{ id: string | null; status: 'loading' | 'playing' }>({ id: null, status: 'loading' });
  const audioCache = useRef<Map<string, AudioBuffer>>(new Map());

  const { translatedData: translatedPlaces, isTranslating } = useAutoTranslator(places);

  const handlePlayAudio = useCallback(async (place: HistoricalPlace) => {
    if (currentAudioSource) {
      currentAudioSource.stop();
      currentAudioSource = null;
    }
    if (audioState.id === place.name) {
      setAudioState({ id: null, status: 'loading' });
      return;
    }

    setAudioState({ id: place.name, status: 'loading' });

    try {
      if (audioCache.current.has(place.name)) {
        playAudioBuffer(audioCache.current.get(place.name)!);
        return;
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const textToSpeak = `${place.name}. ${place.description}. ${place.narrative}`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: textToSpeak }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("No audio data returned");

      const audioData = decode(base64Audio);
      // FIX: Used custom `decodeAudioData` for raw PCM data as per API guidelines.
      const decodedData = await decodeAudioData(audioData, audioContext, 24000, 1);
      audioCache.current.set(place.name, decodedData);
      playAudioBuffer(decodedData);
    } catch (e) {
      console.error("Audio generation failed:", e);
      setAudioState({ id: null, status: 'loading' });
    }
  }, [audioState.id]);

  const playAudioBuffer = (buffer: AudioBuffer) => {
    currentAudioSource = audioContext.createBufferSource();
    currentAudioSource.buffer = buffer;
    currentAudioSource.connect(audioContext.destination);
    currentAudioSource.start(0);
    setAudioState(prev => ({ ...prev, status: 'playing' }));
    currentAudioSource.onended = () => {
      setAudioState({ id: null, status: 'loading' });
      currentAudioSource = null;
    };
  };

  const fetchHistory = useCallback(async () => {
    const cachedItem = localStorage.getItem(HISTORY_CACHE_KEY);
    if (cachedItem) {
        const { timestamp, data } = JSON.parse(cachedItem);
        if (Date.now() - timestamp < HISTORY_CACHE_TTL) {
            setPlaces(data);
            setIsLoading(false);
            return;
        }
    }
    setIsLoading(true);
    setError(null);
    try {
      if (!process.env.API_KEY) throw new Error("API key is not configured.");
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        For 12 significant historical places in Alexandria, Egypt, follow these steps for each place:
        1. Use your search tools to find the following factual information:
           - The common name of the place ('name').
           - A brief historical description ('description').
           - The historical era it belongs to (must be one of "Ptolemaic", "Roman", "Ottoman", or "Modern") ('era').
           - A URL to a historical image or depiction ('ancientImageUrl').
           - Its approximate GPS coordinates ('coordinates').
        2. Based on the information found, perform these creative tasks:
           - Write a short, immersive, first-person narrative (~50 words) about being there in its era ('narrative').
           - Create a descriptive prompt for an image generation model to create a modern, artistic photo of the location ('modernImagePrompt').
        3. Format the final output for all 12 places as a single, valid JSON array of objects. Each object must contain all the keys: "name", "description", "era", "ancientImageUrl", "modernImagePrompt", "narrative", and "coordinates" (format: {"lat": number, "lng": number}).
        Your final response MUST BE ONLY the JSON array, with no other text or markdown.
      `;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { tools: [{ googleSearch: {} }, { googleMaps: {} }] } });
      const sanitizedText = response.text.trim().replace(/^```json\s*|```$/g, '');
      const placesData = JSON.parse(sanitizedText);
      if (!Array.isArray(placesData)) throw new Error("Invalid data format");
      
      const placesWithImages = await Promise.all(
        placesData.map(async (place) => ({
          ...place,
          modernImageUrl: await generateImage(place.modernImagePrompt) || place.ancientImageUrl,
        }))
      );
      setPlaces(placesWithImages);
      localStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: placesWithImages }));
    } catch (e) {
      console.error("Failed to fetch history:", e);
      setError(t.error_historical_places);
    } finally {
      setIsLoading(false);
    }
  }, [t.error_historical_places]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, contentVersion]);

  const filteredPlaces = useMemo(() => {
    if (!translatedPlaces) return [];
    if (activeEra === 'All') return translatedPlaces;
    return translatedPlaces.filter(p => p.era === activeEra);
  }, [translatedPlaces, activeEra]);

  return (
    <>
      <NarrativeModal place={selectedPlace} onClose={() => setSelectedPlace(null)} />
      <div className="relative flex-1 w-full bg-base-100 dark:bg-base-dark-100 text-base-content dark:text-base-content-dark p-4 pt-20 flex flex-col">
        <Header openNav={openNav} />
        
        <div className="sticky top-0 z-20 bg-base-100/80 dark:bg-base-dark-100/80 backdrop-blur-sm -mx-4 px-4 py-2 mb-4">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {ERAS.map(era => (
              <button key={era} onClick={() => setActiveEra(era)} className={`px-3 py-1 text-sm rounded-full font-semibold transition-colors flex-shrink-0 ${activeEra === era ? 'bg-secondary text-base-dark-100' : 'bg-base-200 dark:bg-base-dark-200'}`}>
                {t[`era_${era.toLowerCase()}` as keyof typeof t] || era}
              </button>
            ))}
          </div>
        </div>
        
        <main className="flex-1 z-10" style={{ perspective: '1000px' }}>
          {(isLoading || isTranslating) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <SkeletonImageCard key={i} className="aspect-[3/4]" />)}
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-full"><p className="text-center text-accent">{error}</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlaces.map((place, index) => (
                <div key={`${place.name}-${index}`} className="animate-fade-in-up" style={{ animationDelay: `${index * 80}ms` }}>
                  <HistoryCard 
                    place={place} 
                    onReadMore={() => setSelectedPlace(place)}
                    onPlayAudio={() => handlePlayAudio(place)}
                    audioState={audioState.id === place.name ? audioState.status : null}
                  />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default HistoryPage;