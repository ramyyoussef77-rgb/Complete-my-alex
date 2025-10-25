

import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob, ConnectRequest, Type, FunctionDeclaration } from "@google/genai";
import { ConversationTurn, User, Language } from '../types';
import { encode, decode, decodeAudioData } from '../services/audioUtils';
import { saveConversationHistory } from '../services/firebaseService';
import { Page } from '../App';
import { useTranslations } from './useTranslations';

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
        
        setIsConnecting(true);
        if (conversation.length === 0) {
            setConversation([{ type: 'system', text: 'Connecting...' }]);
        }
        
        try {
            if (!process.env.API_KEY) throw new Error("API_KEY not found.");
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
                        setConversation(prev => prev.filter(t => t.type !== 'system'));
                        
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
                            newAssistantTurn = { type: 'assistant', text: currentOutputTranscription.current, isPartial: true };
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
                                let toolMessage = `Consulting ${fc.name}...`;

                                if (fc.name === 'getCurrentLocation') {
                                    result = locationRef.current ? JSON.stringify(locationRef.current) : "Location not available.";
                                } else if (fc.name === 'navigateToPage') {
                                    const page = fc.args.page as Page;
                                    onNavigate(page);
                                    result = `Navigating to ${page}.`;
                                    toolMessage = t.assistant_navigating.replace('{page}', page);
                                }
                                
                                setConversation(prev => [...prev.map(t => ({...t, isPartial: false})), { type: 'tool', text: toolMessage }]);

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
                                setConversation(prev => prev.map(t => t.type === 'user' && t.isPartial ? { ...t, text: currentInputTranscription.current, isPartial: false } : t));
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
                                if (last?.type === 'assistant' && last.isPartial) {
                                    return [...prev.slice(0, -1), { ...newAssistantTurn! }];
                                }
                                return [...prev.map(t => ({ ...t, isPartial: false })), newAssistantTurn!];
                            });
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        setConversation(prev => [...prev, { type: 'system', text: `Connection error: ${e.message}. Please try again.`}]);
                        stopSession();
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

        } catch (error) {
            console.error('Failed to start session:', error);
            setConversation(prev => [...prev, { type: 'system', text: `Failed to connect. Please check permissions and API key.` }]);
            setIsConnecting(false);
        }
    }, [user, voice, stopSession, conversation, onNavigate, t]);

    // FIX: Added return statement to export the hook's state and methods.
    return {
        isConnecting,
        isConnected,
        isSpeaking,
        isReceivingText,
        conversation,
        startSession,
        stopSession,
        sendTextMessage
    };
};