
import React, { useState } from 'react';
import { useTranslations } from '../hooks/useTranslations';

interface AssistantInputProps {
    onSendText: (text: string) => void;
    isConnecting: boolean;
    isConnected: boolean;
    onMicClick: () => void;
}

const SendIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
);

const MicIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"></path>
        <path d="M17 11h-1c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92z"></path>
    </svg>
);


const AssistantInput: React.FC<AssistantInputProps> = ({ onSendText, isConnecting, isConnected, onMicClick }) => {
    const [text, setText] = useState('');
    const t = useTranslations();

    const handleSend = () => {
        if (text.trim()) {
            onSendText(text);
            setText('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    const hasText = text.trim().length > 0;

    return (
        <div className="w-full max-w-2xl flex items-center p-2 bg-black/30 backdrop-blur-sm rounded-full border border-white/20 shadow-lg">
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t.type_a_message}
                className="flex-1 w-full bg-transparent px-4 py-2 text-white placeholder-white/50 focus:outline-none"
            />
            <button
                onClick={hasText ? handleSend : onMicClick}
                disabled={isConnecting}
                className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none ${hasText ? 'bg-secondary' : 'bg-gradient-to-br from-primary to-accent'} ${isConnecting ? 'animate-pulse' : ''}`}
                aria-label={hasText ? "Send message" : "Start voice session"}
            >
                {isConnecting ? (
                     <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                ) : hasText ? (
                    <SendIcon className="w-6 h-6 text-white" />
                ) : (
                    <MicIcon className={`w-6 h-6 text-white transition-transform duration-300 ${isConnected ? 'scale-110' : ''}`} />
                )}
            </button>
        </div>
    );
};

export default AssistantInput;