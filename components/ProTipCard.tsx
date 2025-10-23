
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ProTip } from '../types';
import { useAutoTranslator } from '../hooks/useAutoTranslator';
import { useTranslations } from '../hooks/useTranslations';

const PRO_TIP_CACHE_KEY = 'proTipCache';
const PRO_TIP_DISMISSED_KEY = 'proTipDismissed';

const ProTipCard: React.FC = () => {
    const t = useTranslations();
    const [tipData, setTipData] = useState<ProTip | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDismissed, setIsDismissed] = useState(() => {
        const today = new Date().toISOString().split('T')[0];
        return sessionStorage.getItem(PRO_TIP_DISMISSED_KEY) === today;
    });

    const { translatedData, isTranslating } = useAutoTranslator(tipData);

    const fetchTip = useCallback(async () => {
        const today = new Date().toISOString().split('T')[0];
        const cached = localStorage.getItem(PRO_TIP_CACHE_KEY);
        if (cached) {
            const { date, data } = JSON.parse(cached);
            if (date === today) {
                setTipData(data);
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
              Generate a single, unique, and helpful "Pro-Tip" for someone in Alexandria, Egypt.
              The tip should be concise, actionable, and friendly. Avoid generic advice.
              Focus on local secrets, best times for activities, or useful daily life hacks specific to the city.
              Respond ONLY with a single, valid JSON object with one key: "tip".
              Example: {"tip": "For the best fresh seafood, visit the Anfoushi fish market early in the morning around 7 AM to buy directly from the fishermen's boats."}
            `;
            
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            const sanitizedText = response.text.trim().replace(/^```json\s*|```$/g, '');
            const data = JSON.parse(sanitizedText);
            setTipData(data);
            localStorage.setItem(PRO_TIP_CACHE_KEY, JSON.stringify({ date: today, data }));
        } catch (e) {
            console.error("Failed to fetch pro tip:", e);
            setError("Couldn't get today's tip.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isDismissed) {
            fetchTip();
        }
    }, [fetchTip, isDismissed]);
    
    const handleDismiss = () => {
        const today = new Date().toISOString().split('T')[0];
        sessionStorage.setItem(PRO_TIP_DISMISSED_KEY, today);
        setIsDismissed(true);
    };

    if (isDismissed) {
        return null;
    }
    
    const isCardLoading = isLoading || isTranslating;

    return (
        <div className="bg-base-dark-200/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/10 h-full flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-semibold text-secondary">{t.pro_tip_of_the_day}</h3>
                <button onClick={handleDismiss} className="text-base-content-dark/50 hover:text-white/80 transition-colors" aria-label="Dismiss tip">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            {isCardLoading ? (
                <div className="flex-1 flex justify-center items-center">
                    <div className="w-5 h-5 border-2 border-current/50 border-t-secondary rounded-full animate-spin"></div>
                </div>
            ) : error ? (
                <p className="text-warning text-xs">{error}</p>
            ) : (
                <p className="text-base-content-dark text-sm flex-1">💡 {translatedData?.tip}</p>
            )}
        </div>
    );
};

export default ProTipCard;
