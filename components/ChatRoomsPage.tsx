import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { ChatMessage } from '../types';
import { useApp } from '../hooks/useApp';
import { useTranslations } from '../hooks/useTranslations';
import { ALEXANDRIA_NEIGHBORHOODS } from '../i18n';
import Header from './Header';
import { getChatMessages, addChatMessage, updateChatMessage, uploadImage } from '../services/firebaseService';
import { useNotifications } from '../hooks/useNotifications';
import RoomSelectionModal from './RoomSelectionModal';
import ChatMessageBubble from './ChatMessageBubble';

interface ChatRoomsPageProps {
  openNav: () => void;
}

const SendIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>;
const ImageUploadIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>;

const BOT_USERS = ["AlexResident", "NileNavigator", "PharosGuide"];

const getRoomBackgroundClass = (room: string) => {
    const foundRoom = ALEXANDRIA_NEIGHBORHOODS.find(r => r.en === room);
    if (foundRoom) {
        switch (foundRoom.en) {
            case 'Sidi Gaber': return 'bg-room-sidi-gaber';
            case 'Miami': return 'bg-room-miami';
            case 'Ramleh Station': return 'bg-room-ramleh';
        }
    }
    return 'bg-base-100 dark:bg-base-dark-100';
};

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
});

const createRipple = (event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
    circle.classList.add("ripple");
    const ripple = button.getElementsByClassName("ripple")[0];
    if (ripple) ripple.remove();
    button.appendChild(circle);
};

const ChatRoomsPage: React.FC<ChatRoomsPageProps> = ({ openNav }) => {
  const { user } = useApp();
  const t = useTranslations();
  const { addNotification } = useNotifications();
  
  const [username] = useState<string>(() => localStorage.getItem('chat_username') || user?.name || 'Anonymous');
  const [isUsernameSet] = useState<boolean>(true); // Simplified from previous version
  
  const [currentRoom, setCurrentRoom] = useState<string>('Smouha');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [usersInRoom, setUsersInRoom] = useState<string[]>([]);
  const [botTyping, setBotTyping] = useState<string | null>(null);
  const [isRoomSelectionOpen, setIsRoomSelectionOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const botTimerRef = useRef<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = getChatMessages(currentRoom, setMessages);
    return () => unsubscribe();
  }, [currentRoom]);

  useEffect(() => {
      setUsersInRoom([username, ...BOT_USERS, 'SeaLover22', 'KosharyKing', 'BibliothecaFan'].slice(0, 4));
  }, [currentRoom, username]);

  // Smart Bot Logic
  useEffect(() => {
    const resetBotTimer = () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      botTimerRef.current = window.setTimeout(async () => {
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const botName = BOT_USERS[Math.floor(Math.random() * BOT_USERS.length)];
          const lastUserMessage = messages.filter(m => !BOT_USERS.includes(m.username)).pop();
          
          let prompt: string;
          if (lastUserMessage && (Date.now() - lastUserMessage.timestamp) < 60000 * 2) {
              prompt = `You are a friendly resident named ${botName} in the "${currentRoom}" neighborhood of Alexandria. A user just said: "${lastUserMessage.text}". Write a short, casual, and relevant reply. Keep it under 20 words.`;
          } else {
              prompt = `You are a friendly resident named ${botName} in the "${currentRoom}" neighborhood. Start a new conversation by sharing a short, interesting thought or question about life in Alexandria. Keep it under 20 words.`;
          }
          
          setBotTyping(botName);
          await new Promise(res => setTimeout(res, 2000 + Math.random() * 1500));
          
          const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
          setBotTyping(null);
          await addChatMessage(currentRoom, { username: botName, text: response.text.trim(), status: 'sent' });
        } catch (e) { 
          console.error("Bot message generation failed:", e);
          setBotTyping(null);
        }
      }, 30000); // 30 seconds of inactivity
    };

    resetBotTimer();
    return () => { if (botTimerRef.current) clearTimeout(botTimerRef.current); };
  }, [messages, currentRoom]);


  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, botTyping]);

  const processMessage = async (msg: ChatMessage) => {
    try {
        if (!process.env.API_KEY) throw new Error("API Key not configured.");
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const moderationPrompt = `Is this message appropriate for a public chat? "${msg.text}". Respond ONLY "true" or "false".`;
        const modResult = await ai.models.generateContent({model: 'gemini-2.5-flash', contents: moderationPrompt});
        
        if (modResult.text.trim().toLowerCase() !== 'true') {
            await updateChatMessage(currentRoom, msg.id, { status: 'failed', text: t.error_inappropriate_message });
            return;
        }

        const finalMessage = await addChatMessage(currentRoom, { username, text: msg.text, imageUrl: msg.imageUrl, imageDescription: msg.imageDescription });
        await updateChatMessage(currentRoom, msg.id, { id: finalMessage.id, status: 'sent', timestamp: finalMessage.timestamp });

    } catch (e) {
        console.error("Failed to process message:", e);
        await updateChatMessage(currentRoom, msg.id, { status: 'failed' });
    } finally {
        setIsSending(false);
    }
  };

  const handleAskAlexCommand = async (query: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    await addChatMessage(currentRoom, { username: 'Alex Assistant', text: `Thinking about "${query}"...`, status: 'sent' });
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: query, config: { tools: [{ googleSearch: {} }, { googleMaps: {} }] } });
    await addChatMessage(currentRoom, { username: 'Alex Assistant', text: response.text.trim(), status: 'sent' });
  };
  
  const handleSendMessage = async (event: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(event);
    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage || isSending) return;
    
    setNewMessage('');

    if (trimmedMessage.startsWith('/ask ')) {
      const query = trimmedMessage.substring(5);
      await handleAskAlexCommand(query);
      return;
    }

    setIsSending(true);
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      username,
      text: trimmedMessage,
      timestamp: Date.now(),
      status: 'pending'
    };
    setMessages(prev => [...prev, optimisticMessage]);
    await processMessage(optimisticMessage);
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSending(true);

    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      username, text: 'Uploading image...', timestamp: Date.now(), status: 'pending'
    };
    setMessages(prev => [...prev, optimisticMessage]);
    
    try {
        const imageUrl = await uploadImage(file);
        const base64Data = await fileToBase64(file);
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const imagePart = { inlineData: { mimeType: file.type, data: base64Data } };
        const textPart = { text: `Describe this image from Alexandria, Egypt in one short sentence.` };
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [imagePart, textPart] } });
        
        await updateChatMessage(currentRoom, optimisticMessage.id, { text: '', imageUrl, imageDescription: response.text, status: 'sent' });
    } catch (err) {
        console.error("Image processing failed:", err);
        await updateChatMessage(currentRoom, optimisticMessage.id, { status: 'failed', text: 'Image upload failed.' });
    } finally {
        setIsSending(false);
    }
  };

  const handleCatchUp = async () => {
      const recentMessages = messages.slice(-30);
      if (recentMessages.length < 2) return;
      const conversation = recentMessages.map(m => `${m.username}: ${m.text}`).join('\n');
      const tempSummaryMessage: ChatMessage = { id: `summary-${Date.now()}`, username: 'Alex Assistant', text: 'Summarizing...', timestamp: Date.now(), status: 'sent' };
      setMessages(prev => [...prev, tempSummaryMessage]);

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `Summarize this chat conversation from an Alexandria chat room into 3-4 bullet points. Focus on the main topics. Conversation:\n${conversation}`;
          const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
          await updateChatMessage(currentRoom, tempSummaryMessage.id, { text: `${t.summary_from_alex}\n- ${response.text.replace(/\*/g, '-').trim()}` });
      } catch (e) {
          await updateChatMessage(currentRoom, tempSummaryMessage.id, { text: 'Sorry, could not generate a summary.' });
      }
  };
  
  const backgroundClass = getRoomBackgroundClass(currentRoom);

  return (
    <>
      <RoomSelectionModal 
        isOpen={isRoomSelectionOpen} 
        onClose={() => setIsRoomSelectionOpen(false)}
        onSelectRoom={(room) => { setCurrentRoom(room); setIsRoomSelectionOpen(false); }}
        currentRoom={currentRoom}
      />
      <div className={`relative flex-1 w-full text-base-content dark:text-base-content-dark flex flex-col transition-colors duration-500 ${backgroundClass}`}>
          <Header openNav={openNav} />
        
          <div className="absolute top-16 left-0 right-0 z-10 px-4 py-2 bg-base-100/80 dark:bg-base-dark-100/80 backdrop-blur-sm flex items-center justify-between">
              <button onClick={() => setIsRoomSelectionOpen(true)} className="text-left font-bold text-lg hover:opacity-80 text-base-content dark:text-base-content-dark">
                  {ALEXANDRIA_NEIGHBORHOODS.find(n => n.en === currentRoom)?.[t.language === 'ar' ? 'ar' : 'en']}
              </button>
              <div className="text-sm opacity-70 text-base-content dark:text-base-content-dark">
                  {usersInRoom.length} {t.users_in_room}
              </div>
          </div>

          <main className="flex-1 overflow-y-auto pt-32 pb-28 px-4 space-y-2">
              {messages.map(msg => (
                  <ChatMessageBubble key={msg.id} message={msg} currentUser={username} room={currentRoom} onRetry={processMessage} />
              ))}
              {botTyping && (
                  <div className="flex items-end gap-2 justify-start animate-pulse">
                      <div className="max-w-xs md:max-w-md p-3 rounded-lg shadow-md bg-base-200/80 dark:bg-base-dark-200/80 backdrop-blur-sm">
                          <p className="font-bold text-sm">{botTyping}</p>
                          <p className="text-sm italic">{t.is_typing}</p>
                      </div>
                  </div>
              )}
              <div ref={messagesEndRef} />
          </main>

          <footer className="absolute bottom-0 left-0 right-0 p-4 bg-base-100/80 dark:bg-base-dark-100/80 backdrop-blur-sm">
              {error && <p className="text-accent text-sm text-center mb-2">{error}</p>}
              <div className="flex items-center gap-2">
                  <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <button onClick={() => imageInputRef.current?.click()} className="p-2 rounded-full hover:bg-base-300 dark:hover:bg-base-dark-300 transition-colors"><ImageUploadIcon/></button>
                  <input
                      type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e as any)}
                      placeholder={t.type_message_placeholder}
                      className="flex-1 w-full px-4 py-2 border border-base-300 dark:border-base-dark-300 rounded-full bg-base-200 dark:bg-base-dark-200"
                  />
                  {messages.length > 10 && <button onClick={handleCatchUp} className="p-2 text-sm font-semibold text-secondary hover:underline whitespace-nowrap">{t.catch_me_up}</button>}
                  <button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()} className="ripple-container p-2 rounded-full bg-primary text-base-content-dark hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                      {isSending ? <div className="w-6 h-6 border-2 border-base-content-dark/50 border-t-base-content-dark rounded-full animate-spin"></div> : <SendIcon />}
                  </button>
              </div>
          </footer>
      </div>
    </>
  );
};

export default ChatRoomsPage;