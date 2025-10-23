import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Modality } from "@google-ai/generativelanguage";
import { useTranslations } from '../hooks/useTranslations';
import { ALEXANDRIA_NEIGHBORHOODS } from '../i18n';
import { ChatRoomInfo } from '../types';

interface RoomSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectRoom: (room: string) => void;
    currentRoom: string;
}

const RoomSelectionModal: React.FC<RoomSelectionModalProps> = ({ isOpen, onClose, onSelectRoom, currentRoom }) => {
    const t = useTranslations();
    const [roomDetails, setRoomDetails] = useState<Record<string, Omit<ChatRoomInfo, 'name'>>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRoomDetails = async () => {
            const cachedDetails = localStorage.getItem('chatRoomDetails');
            if (cachedDetails) {
                setRoomDetails(JSON.parse(cachedDetails));
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const newDetails: Record<string, Omit<ChatRoomInfo, 'name'>> = {};

                for (const room of ALEXANDRIA_NEIGHBORHOODS) {
                    const prompt = `A beautiful, artistic, and iconic image representing the ${room.en} neighborhood in Alexandria, Egypt.`;
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash-image',
                        contents: { parts: [{ text: prompt }] },
                        config: { responseModalities: [Modality.IMAGE] },
                    });
                    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
                    newDetails[room.en] = {
                        description: room.description || '',
                        imageUrl: part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : ''
                    };
                }
                setRoomDetails(newDetails);
                localStorage.setItem('chatRoomDetails', JSON.stringify(newDetails));
            } catch (error) {
                console.error("Failed to generate room details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            fetchRoomDetails();
        }
    }, [isOpen]);
    
    const roomsToDisplay = useMemo(() => {
        return ALEXANDRIA_NEIGHBORHOODS.map(room => ({
            ...room,
            ...roomDetails[room.en],
        }));
    }, [roomDetails]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-40 flex justify-center items-center" onClick={onClose}>
            <div className="bg-base-dark-100 p-6 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-center text-secondary mb-4">{t.choose_a_room}</h2>
                <div className="flex-1 overflow-y-auto pr-2">
                    {isLoading ? (
                        <p className="text-center text-white/70">{t.generating_room_details}</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {roomsToDisplay.map(room => (
                                <button
                                    key={room.en}
                                    onClick={() => onSelectRoom(room.en)}
                                    className={`relative block rounded-xl overflow-hidden shadow-lg group text-left h-48 border-2 ${currentRoom === room.en ? 'border-secondary' : 'border-transparent'}`}
                                >
                                    <img src={room.imageUrl} alt={room.en} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                    <div className="absolute bottom-0 left-0 p-3 text-white">
                                        <h3 className="text-lg font-bold">{t.language === 'ar' ? room.ar : room.en}</h3>
                                        <p className="text-xs line-clamp-2 opacity-90">{room.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RoomSelectionModal;
