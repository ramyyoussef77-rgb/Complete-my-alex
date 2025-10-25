
import React, { useRef, useEffect } from 'react';
import { ConversationTurn } from '../types';
import StatusBar from './StatusBar';
import Waveform from './Waveform';
import AssistantMessage from './AssistantMessage';
import SuggestionChips from './SuggestionChips';
import AssistantInput from './AssistantInput';
import { useTranslations } from '../hooks/useTranslations'; // Import useTranslations

interface AssistantPageProps {
    conversation: ConversationTurn[];
    isConnecting: boolean;
    isConnected: boolean;
    isSpeaking: boolean;
    isReceivingText: boolean;
    onExit: () => void;
    sendTextMessage: (text: string) => void;
    startSession: () => void;
    hasApiKey: boolean; // NEW: Prop to indicate if an API key is available/selected
    promptApiKeySelection: () => void; // NEW: Prop to trigger API key selection
}

const AssistantPage: React.FC<AssistantPageProps> = ({
    conversation,
    isConnecting,
    isConnected,
    isSpeaking,
    isReceivingText,
    onExit,
    sendTextMessage,
    startSession,
    hasApiKey, // Destructure new props
    promptApiKeySelection // Destructure new props
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastMessage = conversation[conversation.length - 1];
    const suggestions = (!lastMessage?.isPartial && lastMessage?.type === 'assistant' && lastMessage.suggestions) ? lastMessage.suggestions : [];
    const t = useTranslations(); // Initialize translations

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]);

    // NEW: Conditional rendering for API key prompt
    if (!isConnected && !isConnecting && !hasApiKey) {
        return (
            <div className="relative h-full w-full flex flex-col items-center justify-center p-8 text-base-content-dark bg-gradient-to-b from-primary to-base-dark-100">
                <h2 className="text-display text-white mb-4">{t.api_key_required_title}</h2>
                <p className="text-body-lg text-white/80 text-center max-w-md mb-6">{t.api_key_required_description}</p>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline mb-8">
                    {t.read_billing_docs}
                </a>
                <button
                    onClick={async () => {
                        await promptApiKeySelection(); // Prompt user to select key
                        startSession(); // Attempt to start session after key selection
                    }}
                    className="px-8 py-3 bg-secondary text-base-dark-100 font-bold rounded-full text-lg hover:opacity-90 transition-opacity"
                >
                    {t.api_key_selection_button}
                </button>
                <button onClick={onExit} className="mt-8 px-6 py-2 bg-white/10 rounded-full backdrop-blur-sm text-sm hover:bg-white/20 transition-colors">
                    Exit
                </button>
            </div>
        );
    }

    return (
        <div className="relative h-full w-full flex flex-col bg-gradient-to-b from-primary to-base-dark-100 text-base-content-dark overflow-hidden">
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
                {/* Conditionally render AssistantInput based on connection and API key status */}
                {(isConnected || isConnecting) && hasApiKey && (
                    <AssistantInput
                        onSendText={sendTextMessage}
                        isConnecting={isConnecting}
                        isConnected={isConnected}
                        onMicClick={startSession}
                    />
                )}
                <button onClick={onExit} className="mt-4 px-6 py-2 bg-white/10 rounded-full backdrop-blur-sm text-sm hover:bg-white/20 transition-colors">
                    Exit
                </button>
            </footer>
        </div>
    );
};

export default AssistantPage;
