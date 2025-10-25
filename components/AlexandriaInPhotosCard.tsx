import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AlexandriaPhoto } from '../types';
import { useAutoTranslator } from '../hooks/useAutoTranslator';
import { useTranslations } from '../hooks/useTranslations';

const PHOTOS_CACHE_KEY = 'alexPhotosCache';

interface AlexandriaInPhotosCardProps {
    shouldFetch: boolean;
}

const AlexandriaInPhotosCard: React.FC<AlexandriaInPhotosCardProps> = ({ shouldFetch }) => {
    const t = useTranslations();
    const [photos, setPhotos] = useState<AlexandriaPhoto[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { translatedData, isTranslating } = useAutoTranslator(photos);

    const fetchPhotos = useCallback(async () => {
        const today = new Date().toISOString().split('T')[0];
        const cached = localStorage.getItem(PHOTOS_CACHE_KEY);
        if (cached) {
            const { date, data } = JSON.parse(cached);
            if (date === today) {
                setPhotos(data);
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
              Find 3 recent online articles or posts about Alexandria, Egypt that feature prominent images.
              For each one, provide the source URL, a description of the main image, and a direct URL to that image.
              Respond ONLY with a single, valid JSON array of objects. Each object must have three keys: "imageUrl", "description", and "url" (the source page URL).
              Example: [{"imageUrl": "https://example.com/photo.jpg", "description": "Sunset over the Stanley Bridge", "url": "https://source.com/page"}]
            `;
            
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { tools: [{ googleSearch: {} }] } });
            const sanitizedText = response.text.trim().replace(/^```json\s*|```$/g, '');
            const data = JSON.parse(sanitizedText);
            setPhotos(data);
            localStorage.setItem(PHOTOS_CACHE_KEY, JSON.stringify({ date: today, data }));
        } catch (e) {
            console.error("Failed to fetch photos:", e);
            setError("Couldn't load photos.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (shouldFetch) {
            fetchPhotos();
        }
    }, [fetchPhotos, shouldFetch]);
    
    const isCardLoading = isLoading || (isTranslating && !!photos);

    return (
        <div className="glassmorphism-enhanced tilt-card p-4 rounded-xl shadow-lg h-full flex flex-col">
            <h3 className="text-subtitle text-secondary mb-2">{t.alexandria_in_photos}</h3>
            {isCardLoading ? (
                <div className="flex-1 grid grid-cols-3 gap-2 animate-pulse">
                    <div className="bg-base-dark-300 rounded-lg"></div>
                    <div className="bg-base-dark-300 rounded-lg"></div>
                    <div className="bg-base-dark-300 rounded-lg"></div>
                </div>
            ) : error ? (
                <div className="flex-1 flex justify-center items-center">
                    <p className="text-warning text-xs">{error}</p>
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-3 gap-2">
                    {translatedData?.map((photo, index) => (
                        <a href={photo.url} key={index} target="_blank" rel="noopener noreferrer" className="block relative rounded-lg overflow-hidden group">
                            <img src={photo.imageUrl} alt={photo.description} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                            <p className="absolute bottom-1 left-1.5 text-white text-caption leading-tight font-medium drop-shadow-sm">{photo.description}</p>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AlexandriaInPhotosCard;