
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob, ConnectRequest, Type, FunctionDeclaration } from "@google/genai";
import { ConversationTurn, User, Language } from '../types';
import { encode, decode, decodeAudioData } from '../services/audioUtils';
import { saveConversationHistory } from '../services/firebaseService';
import { Page } from '../App';
import { useTranslations } from './useTranslations';

// FIX: Removed the declare global block for aistudio.
// The prompt states "Assume this variable is pre-configured, valid, and accessible".
// This implies window.aistudio is already declared elsewhere, and redeclaring it
// here causes "Subsequent property declarations must have the same type" errors.


export const useVoiceAssistant = (
    user: User | null,
    voice: string, 
    language: Language,
    location: { latitude: number; longitude: number; } | null,
    initialHistory: ConversationTurn[] | null,
    onNavigate: (page: Page) => void
) => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [conversation, setConversation] = useState<ConversationTurn[]>([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isReceivingText, setIsReceivingText] = useState(false);
    const [hasApiKey, setHasApiKey] = useState(true); // Assume API key is present initially
    const t = useTranslations();

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const outputSources = useRef(new Set<AudioBufferSourceNode>()).current;
    const nextStartTime = useRef(0);
    const currentInputTranscription = useRef('');
    const currentOutputTranscription = useRef('');
    
    const locationRef = useRef(location);
    useEffect(() => {
        locationRef.current = location;
    }, [location]);

    useEffect(() => {
        if (initialHistory) {
            setConversation(initialHistory);
        }
    }, [initialHistory]);

    const connectionStateRef = useRef({ isConnecting: false, isConnected: false });
    useEffect(() => {
        connectionStateRef.current = { isConnecting, isConnected };
    }, [isConnecting, isConnected]);

    const promptApiKeySelection = useCallback(async () => {
        // Assume window.aistudio exists and is correctly configured
        // FIX: Add type assertion to window.aistudio to ensure TypeScript recognizes its properties
        if ((window as any).aistudio && typeof (window as any).aistudio.openSelectKey === 'function') {
            await (window as any).aistudio.openSelectKey();
            // Optimistically set hasApiKey to true after prompting,
            // hoping the user selects a valid key.
            // A short delay helps mitigate race conditions where process.env.API_KEY
            // might not be updated instantly after openSelectKey returns.
            await new Promise(resolve => setTimeout(resolve, 500)); 
            setHasApiKey(true);
        } else {
            console.error("window.aistudio.openSelectKey is not available.");
            setConversation(prev => [...prev.map(t => ({...t, isPartial: false})), { type: 'system', text: "API key selection mechanism not found." }]);
            setHasApiKey(false); // Stay false if mechanism isn't there.
        }
    }, []);

    const stopSession = useCallback(async (isExit = false) => {
        if (!connectionStateRef.current.isConnected && !connectionStateRef.current.isConnecting) return;
        
        if (isExit && user) {
            const finalConversation = conversation.filter(turn => !turn.isPartial && turn.type !== 'system');
            if (finalConversation.length > 0) {
              await saveConversationHistory(user.uid, finalConversation);
            }
        }

        sessionPromiseRef.current?.then(session => session.close()).catch(console.error);
        sessionPromiseRef.current = null;
        
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        
        if (inputAudioContextRef.current?.state !== 'closed') inputAudioContextRef.current?.close().catch(console.error);
        if (outputAudioContextRef.current?.state !== 'closed') outputAudioContextRef.current?.close().catch(console.error);
        
        outputSources.forEach(source => source.stop());
        outputSources.clear();
        nextStartTime.current = 0;
        
        setIsSpeaking(false);
        setIsReceivingText(false);
        setIsConnected(false);
        setIsConnecting(false);
        
        if (isExit) {
          setConversation([]);
        }
    }, [outputSources, user, conversation]);

    const sendTextMessage = (text: string) => {
        if (!text.trim() || !sessionPromiseRef.current) return;
        sessionPromiseRef.current.then(session => {
            session.sendRealtimeInput({ text });
            setConversation(prev => [...prev.map(t => ({...t, isPartial: false})), { type: 'user', text }]);
        });
    };

    const startSession = useCallback(async () => {
        if (connectionStateRef.current.isConnected || connectionStateRef.current.isConnecting || !user) return;
        
        // --- API Key Pre-check ---
        if (!process.env.API_KEY) {
            setHasApiKey(false);
            setConversation(prev => [...prev.map(turn => ({...turn, isPartial: false})), { type: 'system', text: t.api_key_missing_prompt }]);
            promptApiKeySelection();
            return;
        }

        if (!hasApiKey) { // If hasApiKey was previously set to false due to an error
            setConversation(prev => [...prev.map(turn => ({...turn, isPartial: false})), { type: 'system', text: t.api_key_reselect_prompt }]);
            promptApiKeySelection();
            return;
        }

        setIsConnecting(true);
        if (conversation.length === 0) {
            setConversation([{ type: 'system', text: t.assistant_connecting }]);
        }
        
        try {
            // CRITICAL: Initialize GoogleGenAI *here* to ensure it picks up the latest API key.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            currentInputTranscription.current = '';
            currentOutputTranscription.current = '';
            nextStartTime.current = 0;
            
            const systemInstruction = `You are a helpful and conversational AI assistant for the "My Alex" app. You can answer questions, provide information, and help users navigate the app's features. You have access to Google Search, Google Maps, and Google Places to provide accurate and up-to-date information. Be friendly, clear, and concise in your responses.`;

            const getCurrentLocationDeclaration: FunctionDeclaration = { name: 'getCurrentLocation', description: 'Get the user\'s current GPS location.', parameters: { type: Type.OBJECT, properties: {} } };
            const navigateToPageDeclaration: FunctionDeclaration = {
                name: 'navigateToPage',
                description: 'Navigates the user to a specific page within the My Alex app.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        page: {
                            type: Type.STRING,
                            description: 'The page to navigate to. Must be one of: home, socialBuzz, history, marketplace, chatRooms, settings, events, localServices.'
                        }
                    },
                    required: ['page']
                }
            };

            const connectRequest: ConnectRequest = {
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setIsConnecting(false);
                        setIsConnected(true);
                        setConversation(prev => prev.filter(turn => turn.type !== 'system'));
                        
                        // FIX: Changed inputAudioContext to inputAudioContextRef.current to access the correct AudioContext instance.
                        const source = inputAudioContextRef.current!.createMediaStreamSource(mediaStreamRef.current!);
                        const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromiseRef.current?.then(session => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64EncodedAudioString) {
                            setIsSpeaking(true);
                            nextStartTime.current = Math.max(
                                nextStartTime.current,
                                outputAudioContextRef.current!.currentTime,
                            );
                            const audioBuffer = await decodeAudioData(
                                decode(base64EncodedAudioString),
                                outputAudioContextRef.current!,
                                24000,
                                1,
                            );
                            const source = outputAudioContextRef.current!.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContextRef.current!.destination);
                            source.addEventListener('ended', () => {
                                outputSources.delete(source);
                                if (outputSources.size === 0) setIsSpeaking(false);
                            });

                            source.start(nextStartTime.current);
                            nextStartTime.current = nextStartTime.current + audioBuffer.duration;
                            outputSources.add(source);
                        } else {
                           if (outputSources.size === 0) setIsSpeaking(false);
                        }

                        if (message.serverContent?.interrupted) {
                            outputSources.forEach(source => source.stop());
                            outputSources.clear();
                            nextStartTime.current = 0;
                            setIsSpeaking(false);
                        }
                        
                        let newAssistantTurn: ConversationTurn | null = null;
                        
                        if (message.serverContent?.outputTranscription) {
                            setIsReceivingText(true);
                            const text = message.serverContent.outputTranscription.text;
                            currentOutputTranscription.current += text;
                            // If this is the first part of the model's speech, add a "thinking" placeholder
                            if (currentOutputTranscription.current.length === text.length) {
                                newAssistantTurn = { type: 'assistant', text: text, isPartial: true };
                            } else {
                                newAssistantTurn = { type: 'assistant', text: currentOutputTranscription.current, isPartial: true };
                            }
                        }
                        
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            currentInputTranscription.current += text;
                            setConversation(prev => {
                                const last = prev[prev.length - 1];
                                if (last?.type === 'user' && last.isPartial) {
                                    return [...prev.slice(0, -1), { ...last, text: currentInputTranscription.current }];
                                }
                                return [...prev, { type: 'user', text: currentInputTranscription.current, isPartial: true }];
                            });
                        }

                        if (message.toolCall) {
                            for (const fc of message.toolCall.functionCalls) {
                                let result: any;
                                let toolMessage = `Consulting ${fc.name}...`; // Default generic message

                                if (fc.name === 'getCurrentLocation') {
                                    toolMessage = t.assistant_consulting_maps; // More specific for location
                                    result = locationRef.current ? JSON.stringify(locationRef.current) : "Location not available.";
                                } else if (fc.name === 'navigateToPage') {
                                    const page = fc.args.page as Page;
                                    toolMessage = t.assistant_navigating.replace('{page}', page);
                                    onNavigate(page);
                                    result = `Navigating to ${page}.`;
                                } else if (fc.name === 'googleSearch') {
                                    toolMessage = t.assistant_searching_web;
                                    result = "Searching..."; // Placeholder, actual search happens server-side
                                } else if (fc.name === 'googleMaps') {
                                    toolMessage = t.assistant_consulting_maps;
                                    result = "Consulting maps..."; // Placeholder
                                }
                                
                                setConversation(prev => [...prev.map(turn => ({...turn, isPartial: false})), { type: 'tool', text: toolMessage }]);

                                sessionPromiseRef.current?.then((session) => {
                                    session.sendToolResponse({
                                        functionResponses: {
                                            id: fc.id,
                                            name: fc.name,
                                            response: { result: result },
                                        }
                                    })
                                });
                            }
                        }

                        if (message.serverContent?.turnComplete) {
                            setIsReceivingText(false);
                            if (currentInputTranscription.current) {
                                setConversation(prev => prev.map(turn => turn.type === 'user' && turn.isPartial ? { ...turn, text: currentInputTranscription.current, isPartial: false } : turn));
                            }
                            if (currentOutputTranscription.current) {
                                newAssistantTurn = { type: 'assistant', text: currentOutputTranscription.current, isPartial: false };
                            }
                            currentInputTranscription.current = '';
                            currentOutputTranscription.current = '';
                        }

                        if (newAssistantTurn) {
                            setConversation(prev => {
                                const last = prev[prev.length - 1];
                                // If the last message was a partial assistant message, update it
                                if (last?.type === 'assistant' && last.isPartial) {
                                    return [...prev.slice(0, -1), { ...newAssistantTurn! }];
                                }
                                // Otherwise, add the new assistant turn (after ensuring previous partials are finalized)
                                return [...prev.map(turn => ({ ...turn, isPartial: false })), newAssistantTurn!];
                            });
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        if (e.message.includes("Requested entity was not found.")) {
                            setHasApiKey(false); // Indicate that the key might be invalid
                            setConversation(prev => [...prev, { type: 'system', text: t.api_key_invalid_reselect }]);
                            promptApiKeySelection(); // Prompt user to re-select
                            stopSession(); // Stop the current problematic session
                        } else {
                            setConversation(prev => [...prev, { type: 'system', text: `${t.connection_error}: ${e.message}. ${t.try_again_later}`}]);
                            stopSession();
                        }
                    },
                    onclose: () => {
                        console.log('Session closed');
                        stopSession();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
                    },
                    systemInstruction,
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    tools: [{ functionDeclarations: [getCurrentLocationDeclaration, navigateToPageDeclaration] }],
                },
            };
            
            sessionPromiseRef.current = ai.live.connect(connectRequest);
            await sessionPromiseRef.current;

        } catch (error: any) { // Catch all errors here
            console.error('Failed to start session:', error);
            if (error.message.includes("API key")) { // A more generic check if the initial check failed or if the key is structurally invalid
                setHasApiKey(false);
                setConversation(prev => [...prev, { type: 'system', text: t.api_key_error_generic }]);
                promptApiKeySelection();
            } else {
                setConversation(prev => [...prev, { type: 'system', text: `${t.failed_to_connect_generic}.`}]);
            }
            setIsConnecting(false);
        }
    }, [user, voice, stopSession, conversation, onNavigate, t, hasApiKey, promptApiKeySelection, location]); // Add hasApiKey and promptApiKeySelection to dependencies

    // FIX: Added return statement to export the hook's state and methods.
    return {
        isConnecting,
        isConnected,
        isSpeaking,
        isReceivingText,
        conversation,
        startSession,
        stopSession,
        sendTextMessage,
        hasApiKey,
        promptApiKeySelection
    };
};