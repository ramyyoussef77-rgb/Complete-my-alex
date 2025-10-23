
import React, { useRef, useEffect } from 'react';
import { ConversationTurn } from '../types';
import StatusBar from './StatusBar';
import Waveform from './Waveform';
import AssistantMessage from './AssistantMessage';
import SuggestionChips from './SuggestionChips';
import AssistantInput from './AssistantInput';

interface AssistantPageProps {
    conversation: ConversationTurn[];
    isConnecting: boolean;
    isConnected: boolean;
    isSpeaking: boolean;
    isReceivingText: boolean;
    onExit: () => void;
    sendTextMessage: (text: string) => void;
    startSession: () => void;
}

const AssistantPage: React.FC<AssistantPageProps> = ({
    conversation,
    isConnecting,
    isConnected,
    isSpeaking,
    isReceivingText,
    onExit,
    sendTextMessage,
    startSession
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastMessage = conversation[conversation.length - 1];
    const suggestions = (!lastMessage?.isPartial && lastMessage?.type === 'assistant' && lastMessage.suggestions) ? lastMessage.suggestions : [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]);

    return (
        <div className="relative h-full w-full flex flex-col bg-gradient-to-b from-primary via-[#1e4265] to-base-dark-100 text-base-content-dark overflow-hidden">
            <StatusBar />
            <main className="flex-1 flex flex-col pt-10 pb-40 overflow-hidden">
                <div className="flex-1 overflow-y-auto px-4 space-y-4">
                    {conversation.map((turn, index) => (
                        <AssistantMessage key={index} turn={turn} />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                {suggestions.length > 0 && (
                    <SuggestionChips
                        suggestions={suggestions}
                        onChipClick={sendTextMessage}
                    />
                )}
            </main>
            
            <footer className="absolute bottom-0 left-0 right-0 p-4 z-20 flex flex-col items-center">
                <div className="w-full max-w-4xl h-24 -mb-4">
                    <Waveform isListening={isConnected} isSpeaking={isSpeaking} isReceivingText={isReceivingText} />
                </div>
                <AssistantInput
                    onSendText={sendTextMessage}
                    isConnecting={isConnecting}
                    isConnected={isConnected}
                    onMicClick={startSession}
                />
                <button onClick={onExit} className="mt-4 px-6 py-2 bg-white/10 rounded-full backdrop-blur-sm text-sm hover:bg-white/20 transition-colors">
                    Exit
                </button>
            </footer>
        </div>
    );
};

export default AssistantPage;
