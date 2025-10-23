import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useApp } from './useApp';

// Simple session cache to avoid re-translating the same text
const translationCache = new Map<string, any>();

export const useAutoTranslator = <T,>(data: T | null): { translatedData: T | null; isTranslating: boolean } => {
  const { language } = useApp();
  const [translatedData, setTranslatedData] = useState<T | null>(data);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const translate = async () => {
      if (!data || language === 'en') {
        setTranslatedData(data);
        return;
      }

      const cacheKey = JSON.stringify(data) + `_to_${language}`;
      if (translationCache.has(cacheKey)) {
        setTranslatedData(translationCache.get(cacheKey));
        return;
      }

      setIsTranslating(true);
      try {
        if (!process.env.API_KEY) throw new Error("API key is not configured.");
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const prompt = `
          Translate the following JSON object's string values to Arabic.
          Maintain the exact same JSON structure, including all keys and non-string values.
          Only translate the text content of the string values. For example, a day like "Tomorrow" should be translated, but a URL should not be.
          Your response MUST be ONLY the translated JSON object. Do not include any text, explanations, or markdown code blocks like \`\`\`json.

          JSON to translate:
          ${JSON.stringify(data)}
        `;

        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const sanitizedText = response.text.trim().replace(/^```json\s*|```$/g, '');
        const parsedTranslation = JSON.parse(sanitizedText);
        
        translationCache.set(cacheKey, parsedTranslation);
        setTranslatedData(parsedTranslation);

      } catch (error) {
        console.error("Auto-translation failed:", error);
        // Fallback to original data on error
        setTranslatedData(data);
      } finally {
        setIsTranslating(false);
      }
    };

    translate();
  }, [data, language]);

  return { translatedData, isTranslating };
};
