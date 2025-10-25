import React, { useState, useEffect } from 'react';
import { MarketplaceItem } from '../types';
import { GoogleGenAI } from '@google/genai';
import { useTranslations } from '../hooks/useTranslations';
import MarketplaceCard from './MarketplaceCard';
import { SkeletonImageCard } from './SkeletonLoader';

interface FindSimilarModalProps {
    item: MarketplaceItem | null;
    allItems: MarketplaceItem[];
    onClose: () => void;
    onSelectItem: (item: MarketplaceItem) => void;
}

const FindSimilarModal: React.FC<FindSimilarModalProps> = ({ item, allItems, onClose, onSelectItem }) => {
    const t = useTranslations();
    const [similarItems, setSimilarItems] = useState<MarketplaceItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const findSimilar = async () => {
            if (!item) return;
            setIsLoading(true);
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
                // Filter out the item itself from the search list
                const searchCorpus = allItems.filter(i => i.id !== item.id);
                const prompt = `
                  From this list of marketplace items: ${JSON.stringify(searchCorpus)},
                  find up to 3 items that are most similar to this one: ${JSON.stringify({ title: item.title, description: item.description, category: item.category })}.
                  Return ONLY a valid JSON array of the full item objects for the matches. If no matches, return [].
                `;
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                const parsed = JSON.parse(response.text.replace(/^```json\s*|```$/g, ''));
                setSimilarItems(parsed);
            } catch (error) {
                console.error("Failed to find similar items:", error);
            } finally {
                setIsLoading(false);
            }
        };
        findSimilar();
    }, [item, allItems]);

    if (!item) return null;

    const handleSelect = (selected: MarketplaceItem) => {
        onClose();
        onSelectItem(selected);
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-base-dark-100 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-base-content-dark/10">
                    <h2 className="text-xl font-bold text-secondary">{t.find_similar}</h2>
                    <p className="text-sm text-base-content-dark/70">For "{item.title}"</p>
                </div>
                <div className="flex-1 p-4 overflow-y-auto">
                    {isLoading ? (
                        <div className="grid grid-cols-3 gap-4">
                            {[...Array(3)].map((_, i) => <SkeletonImageCard key={i} />)}
                        </div>
                    ) : similarItems.length > 0 ? (
                        <div className="grid grid-cols-3 gap-4">
                            {similarItems.map(simItem => (
                                <MarketplaceCard key={simItem.id} item={simItem} onSelect={() => handleSelect(simItem)} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-base-content-dark/70">No similar items found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FindSimilarModal;