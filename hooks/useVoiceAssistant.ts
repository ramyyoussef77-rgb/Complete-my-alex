
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

    const sendTextMessage = useCallback((text: string) => {
        if (!text.trim() || !sessionPromiseRef.current) return;
        sessionPromiseRef.current.then(session => {
            session.sendTextInput({ text });
            setConversation(prev => [...prev.map(t => ({...t, isPartial: false})), { type: 'user', text }]);
        });
    }, []);

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
            
            const userLanguage = language === 'ar' ? 'Arabic' : 'English';
            const systemInstruction = `You are Alex, a friendly and helpful AI assistant for the 'My Alex' app. The user's name is ${user.name}. Always greet them by name at the start of a new conversation if the history is empty.
You can navigate the app for the user using the navigateToPage function. Available pages are: home, socialBuzz, history, marketplace, chatRooms, settings, events, localServices.
After providing a helpful response, you MUST suggest 2-3 relevant follow-up actions or questions for the user. Format them at the very end of your response like this: [Suggestions: "Suggestion 1", "Suggestion 2"]
Your main response MUST follow this structure exactly:
[Clear, concise answer in the user’s language (${userLanguage})]

🔹 **Confidence**: [Your confidence level: High, Medium, Low, or None]
🔹 **Source**: [The primary source of your information, e.g., "Google Maps", "Web search", "Internal knowledge", or "App function"]
🔹 **Note**: [Optional: Provide brief context, a limitation, or a helpful suggestion. If none, omit this line.]`;

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
                        
                        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                        scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current.onaudioprocess = (event) => {
                            const inputData = event.inputBuffer.getChannelData(0);
                            const pcmBlob: Blob = { data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)), mimeType: 'audio/pcm;rate=16000' };
                            sessionPromiseRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob })).catch(console.error);
                        };
                        source.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                       if (message.toolCall?.functionCalls) {
                           for (const fc of message.toolCall.functionCalls) {
                               let result = "Function executed.";
                               if (fc.name === 'getCurrentLocation') {
                                   result = locationRef.current ? `User's current location is latitude ${locationRef.current.latitude}, longitude ${locationRef.current.longitude}` : "Location not available.";
                                   setConversation(prev => [...prev, {type: 'tool', text: t.assistant_consulting_maps}]);
                               }
                               if (fc.name === 'navigateToPage') {
                                   const page = fc.args.page as Page;
                                   onNavigate(page);
                                   result = `Successfully navigated to ${page}.`;
                                   setConversation(prev => [...prev, {type: 'tool', text: t.assistant_navigating.replace('{page}', page) }]);
                               }
                               sessionPromiseRef.current?.then(session => session.sendToolResponse({
                                   functionResponses: { id: fc.id, name: fc.name, response: { result } }
                               }));
                           }
                       }
                       
                       const grounding = message.serverContent?.modelTurn?.groundingMetadata?.groundingChunks;
                       if (grounding && grounding.length > 0 && !isReceivingText) {
                           const sourceText = grounding[0].web ? t.assistant_searching_web : grounding[0].maps ? t.assistant_consulting_maps : t.assistant_thinking;
                           setConversation(prev => {
                               const lastTurn = prev[prev.length - 1];
                               if (lastTurn?.type === 'tool' && lastTurn?.isPartial) return prev; // Avoid duplicate tool messages
                               return [...prev, {type: 'tool', text: sourceText, isPartial: true}]
                           });
                       }

                       if (message.serverContent?.inputTranscription) {
                            currentInputTranscription.current += message.serverContent.inputTranscription.text;
                            setConversation(prev => {
                                const last = prev[prev.length - 1];
                                if (last?.type === 'user' && last.isPartial) {
                                    return [...prev.slice(0, -1), { ...last, text: currentInputTranscription.current }];
                                }
                                return [...prev.filter(t => t.type !== 'system'), { type: 'user', text: currentInputTranscription.current, isPartial: true }];
                            });
                        }
                         if (message.serverContent?.outputTranscription) {
                            setIsReceivingText(true);
                            currentOutputTranscription.current += message.serverContent.outputTranscription.text;
                            setConversation(prev => {
                                // Fix: Use `let` for variables that need reassignment and work with a copy of the state array.
                                let conversation = prev;
                                let last = prev[prev.length - 1];
                                
                                // Replace partial tool message with assistant message
                                if(last?.type === 'tool' && last.isPartial) {
                                  conversation = prev.slice(0, -1);
                                  last = conversation[conversation.length - 1];
                                }

                                if (last?.type === 'assistant' && last.isPartial) {
                                    return [...conversation.slice(0, -1), { ...last, text: currentOutputTranscription.current, grounding }];
                                }
                                return [...conversation, { type: 'assistant', text: currentOutputTranscription.current, isPartial: true, grounding }];
                            });
                        }
                        if (message.serverContent?.turnComplete) {
                            setIsReceivingText(false);
                            const finalAssistantText = currentOutputTranscription.current;
                            const suggestionRegex = /\[Suggestions:\s*(.*?)\]/s;
                            const match = finalAssistantText.match(suggestionRegex);
                            let suggestions: string[] = [];
                            if (match && match[1]) {
                                try {
                                    suggestions = JSON.parse(`[${match[1]}]`);
                                } catch (e) { console.error("Failed to parse suggestions"); }
                            }
                            const cleanedText = finalAssistantText.replace(suggestionRegex, '').trim();

                            setConversation(prev => prev.map(turn => turn.isPartial ? {...turn, isPartial: false, text: turn.type === 'assistant' ? cleanedText : turn.text, suggestions} : turn));
                            currentInputTranscription.current = '';
                            currentOutputTranscription.current = '';
                        }
                        
                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (audioData && outputAudioContextRef.current?.state === 'running') {
                           setIsSpeaking(true);
                           const audioContext = outputAudioContextRef.current;
                           const audioBuffer = await decodeAudioData(decode(audioData), audioContext, 24000, 1);
                           const source = audioContext.createBufferSource();
                           source.buffer = audioBuffer;
                           source.connect(audioContext.destination);
                           
                           nextStartTime.current = Math.max(nextStartTime.current, audioContext.currentTime);
                           source.start(nextStartTime.current);
                           nextStartTime.current += audioBuffer.duration;

                           outputSources.add(source);
                           source.onended = () => {
                                outputSources.delete(source);
                                if (outputSources.size === 0) setIsSpeaking(false);
                           };
                        }
                    },
                    onerror: (e: any) => {
                        console.error('Session error:', e);
                        setConversation([{ type: 'system', text: 'Session error. Please try again.' }]);
                        stopSession(false);
                    },
                    onclose: () => stopSession(false),
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    tools: [{ googleSearch: {} }, { googleMaps: {} }, { functionDeclarations: [getCurrentLocationDeclaration, navigateToPageDeclaration] }],
                    systemInstruction
                },
            };

            if (location) {
                connectRequest.toolConfig = { retrievalConfig: { latLng: { latitude: location.latitude, longitude: location.longitude }}};
            }

            sessionPromiseRef.current = ai.live.connect(connectRequest);
        } catch (error: any) {
            console.error("Failed to start session:", error);
            setConversation([{ type: 'system', text: 'Failed to start. Check permissions and API key.' }]);
            setIsConnecting(false);
        }
    }, [stopSession, voice, language, outputSources, location, user, onNavigate, t, conversation.length, initialHistory]);

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