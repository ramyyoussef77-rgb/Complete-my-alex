
import React, { useState, useEffect } from 'react';
import { LocalEvent } from '../types';
import { GoogleGenAI } from '@google/genai';
import { useTranslations } from '../hooks/useTranslations';

interface EventAnalysisModalProps {
    event: LocalEvent | null;
    onClose: () => void;
}

const EventAnalysisModal: React.FC<EventAnalysisModalProps> = ({ event, onClose }) => {
    const t = useTranslations();
    const [analysis, setAnalysis] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const analyze = async () => {
            if (!event) return;
            setIsLoading(true);
            setAnalysis('');
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
                const prompt = `Given this event: "${event.name} - ${event.description}", write a one-sentence summary explaining who would enjoy this event the most. Respond with only the summary sentence.`;
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                setAnalysis(response.text);
            } catch (error) {
                console.error("Analysis failed:", error);
                setAnalysis("Sorry, I couldn't analyze this event.");
            } finally {
                setIsLoading(false);
            }
        };
        analyze();
    }, [event]);

    if (!event) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-page-fade-in" onClick={onClose}>
            <div className="bg-base-dark-200 rounded-lg shadow-xl w-full max-w-md p-6 text-center" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-secondary">{t.analyze_event}</h3>
                <p className="font-semibold mt-1 mb-4">{event.name}</p>
                {isLoading ? (
                    <div className="flex items-center justify-center h-20 gap-2">
                        <div className="w-6 h-6 border-2 border-current/50 border-t-secondary rounded-full animate-spin"></div>
                        <span className="text-lg italic">{t.analyzing}</span>
                    </div>
                ) : (
                    <p className="text-lg italic bg-base-dark-100 p-4 rounded-md">"{analysis}"</p>
                )}
                <button onClick={onClose} className="mt-6 px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity w-full">
                    Close
                </button>
            </div>
        </div>
    );
};

export default EventAnalysisModal;