import React, { useState } from 'react';
import { ChatMessage } from '../types';
import { updateChatMessage } from '../services/firebaseService';
import { useTranslations } from '../hooks/useTranslations';
import ReactionPicker from './ReactionPicker';

interface ChatMessageBubbleProps {
    message: ChatMessage;
    currentUser: string;
    room: string;
    onRetry: (message: ChatMessage) => void;
}

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message, currentUser, room, onRetry }) => {
    const t = useTranslations();
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const isUser = message.username === currentUser;

    const handleReaction = async (emoji: string) => {
        const currentReactions = message.reactions || {};
        const usersForEmoji = currentReactions[emoji] || [];

        if (usersForEmoji.includes(currentUser)) {
            // User is removing their reaction
            currentReactions[emoji] = usersForEmoji.filter(u => u !== currentUser);
            if (currentReactions[emoji].length === 0) {
                delete currentReactions[emoji];
            }
        } else {
            // User is adding a reaction
            currentReactions[emoji] = [...usersForEmoji, currentUser];
        }
        await updateChatMessage(room, message.id, { reactions: currentReactions });
        setIsPickerOpen(false);
    };

    const MessageStatus = () => {
        if (message.status === 'pending') {
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-70" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;
        }
        if (message.status === 'failed') {
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
        }
        return null;
    };

    return (
        <div className={`flex items-end gap-2 group ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`relative max-w-xs md:max-w-md p-3 rounded-lg shadow-md ${isUser ? 'bg-primary text-base-content-dark' : 'bg-base-200 dark:bg-base-dark-200 backdrop-blur-sm'}`}>
                <p className="font-bold text-sm">{message.username}</p>
                
                {message.imageUrl ? (
                    <div className="mt-1">
                        <p className="text-sm italic opacity-90 mb-1">{message.username} {t.image_shared_by}</p>
                        <img src={message.imageUrl} alt={message.imageDescription} className="rounded-md my-1 max-h-48" />
                        <p className="text-sm">{message.imageDescription}</p>
                    </div>
                ) : (
                    <p className="whitespace-pre-wrap text-body">{message.text}</p>
                )}

                <div className="flex justify-end items-center gap-2 mt-1">
                    <p className="text-xs opacity-70">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    {isUser && <MessageStatus />}
                </div>

                {message.reactions && Object.keys(message.reactions).length > 0 && (
                    <div className="absolute -bottom-3 right-2 flex items-center gap-1">
                        {/* FIX: Added Array.isArray(users) as a type guard because TypeScript inferred `users` as `unknown`. */}
                        {Object.entries(message.reactions).map(([emoji, users]) => Array.isArray(users) && users.length > 0 && (
                            <div key={emoji} className="px-1.5 py-0.5 bg-base-300 dark:bg-base-dark-300 rounded-full text-xs shadow-md flex items-center">
                                <span>{emoji}</span>
                                <span className="text-xs ml-1">{users.length}</span>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="absolute top-0 -left-8 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => setIsPickerOpen(true)} className="p-1 rounded-full bg-base-300 dark:bg-base-dark-300 text-sm" title={t.add_reaction}>😊</button>
                   {isPickerOpen && <ReactionPicker onSelect={handleReaction} onClose={() => setIsPickerOpen(false)} />}
                </div>
            </div>
            {message.status === 'failed' && isUser && (
                <button onClick={() => onRetry(message)} className="text-xs text-accent hover:underline">{t.retry_send}</button>
            )}
        </div>
    );
};

export default ChatMessageBubble;