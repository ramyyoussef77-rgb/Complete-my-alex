import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useAutoTranslator } from '../hooks/useAutoTranslator';

interface DailyBriefingCardProps {
    shouldFetch: boolean;
    onFetchComplete: () => void;
}

const DailyBriefingCard: React.FC<DailyBriefingCardProps> = ({ shouldFetch, onFetchComplete }) => {
    const [briefingData, setBriefingData] = useState<{ text: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { translatedData, isTranslating } = useAutoTranslator(briefingData);

    const fetchBriefing = useCallback(async () => {
        const today = new Date().toISOString().split('T')[0];
        const cachedBriefing = localStorage.getItem('dailyBriefing');
        if (cachedBriefing) {
            const { date, data } = JSON.parse(cachedBriefing);
            if (date === today) {
                setBriefingData(data);
                setIsLoading(false);
                onFetchComplete();
                return;
            }
        }

        setIsLoading(true);
        setError(null);
        try {
            if (!process.env.API_KEY) throw new Error("API key is not configured.");
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = `
              Generate a "Today in Alexandria" daily briefing for a mobile app. The tone should be friendly, positive, and concise.
              Your response should be a single paragraph of plain text containing:
              1. A friendly greeting.
              2. A brief, conversational summary of today's weather in Alexandria, Egypt.
              3. One positive and interesting local news headline or upcoming event.
              4. One fascinating historical fact about Alexandria related to today's date if possible, or a general one.
              Do not use any markdown or JSON formatting. Just return the plain text of the briefing.
              Example: "Good morning, Alexandria! ☀️ It's looking like a beautiful sunny day with a gentle sea breeze. In local news, the Bibliotheca Alexandrina is hosting a new art exhibition starting this evening. On this day in history, the famous Pharos Lighthouse was completed, guiding sailors for centuries. Have a fantastic day!"
            `;
            
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { tools: [{ googleSearch: {} }] } });
            const data = { text: response.text.trim() }; // Safely construct the object here
            setBriefingData(data);
            localStorage.setItem('dailyBriefing', JSON.stringify({ date: today, data }));
        } catch (e) {
            console.error("Failed to fetch daily briefing:", e);
            setError("Couldn't fetch today's briefing.");
        } finally {
            setIsLoading(false);
            onFetchComplete();
        }
    }, [onFetchComplete]);

    useEffect(() => {
        if (shouldFetch) {
            fetchBriefing();
        }
    }, [fetchBriefing, shouldFetch]);
    
    const isCardLoading = isLoading || isTranslating;

    return (
        <div className="glassmorphism-enhanced tilt-card p-4 rounded-xl shadow-lg">
            <h3 className="text-title bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-2">Today in Alexandria</h3>
            {isCardLoading ? (
                <div className="flex justify-center items-center h-24">
                    <div className="w-6 h-6 border-2 border-current/50 border-t-secondary rounded-full animate-spin"></div>
                </div>
            ) : error ? (
                <p className="text-warning text-sm">{error}</p>
            ) : (
                <p className="text-body text-base-content-dark">{translatedData?.text}</p>
            )}
        </div>
    );
};
export default DailyBriefingCard;