import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useAutoTranslator } from '../hooks/useAutoTranslator';
import { useTranslations } from '../hooks/useTranslations';

const DailyBuzzSummaryCard: React.FC = () => {
    const t = useTranslations();
    const [summaryData, setSummaryData] = useState<{ summary: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { translatedData, isTranslating } = useAutoTranslator(summaryData);

    const fetchSummary = useCallback(async () => {
        const today = new Date().toISOString().split('T')[0];
        const cachedSummary = localStorage.getItem('dailyBuzzSummary');
        if (cachedSummary) {
            const { date, data } = JSON.parse(cachedSummary);
            if (date === today) {
                setSummaryData(data);
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
              Analyze recent, family-friendly social media buzz about Alexandria, Egypt.
              Generate a short, engaging summary (2-3 sentences) about the general sentiment and most discussed positive or neutral topics of the day.
              Your response MUST be a single, valid JSON object with one key: "summary".
              The "summary" value should be a single string. Do not use markdown.
              Example: {"summary": "The city is buzzing with excitement for the upcoming arts festival, with many sharing photos from the Corniche. Overall sentiment is positive, though some discussions about evening traffic persist."}
            `;
            
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { tools: [{ googleSearch: {} }] } });
            const sanitizedText = response.text.trim().replace(/^```json\s*|```$/g, '');
            const data = JSON.parse(sanitizedText);
            setSummaryData(data);
            localStorage.setItem('dailyBuzzSummary', JSON.stringify({ date: today, data }));
        } catch (e) {
            console.error("Failed to fetch daily buzz summary:", e);
            setError("Couldn't fetch today's summary.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);
    
    const isCardLoading = isLoading || isTranslating;

    return (
        <div className="glassmorphism-enhanced tilt-card p-4 rounded-xl shadow-lg mb-4">
            <h3 className="text-subtitle font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-2">{t.daily_buzz_summary}</h3>
            {isCardLoading ? (
                <div className="flex justify-center items-center h-16">
                    <div className="w-6 h-6 border-2 border-current/50 border-t-secondary rounded-full animate-spin"></div>
                </div>
            ) : error ? (
                <p className="text-warning text-sm">{error}</p>
            ) : (
                <p className="text-body text-base-content-dark">{translatedData?.summary}</p>
            )}
        </div>
    );
};

export default DailyBuzzSummaryCard;