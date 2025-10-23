import React, { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { useTranslations } from '../hooks/useTranslations';
import { GoogleGenAI, Modality } from '@google/genai';

const GoogleIcon = () => <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.618-3.319-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.022 44 30.022 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>;
const FacebookIcon = () => <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.128 22 16.991 22 12z"></path></svg>;

async function generateImage(prompt: string): Promise<string | null> {
  try {
    if (!process.env.API_KEY) return null;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { responseModalities: [Modality.IMAGE] },
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch (e) {
    console.error("Image generation failed:", e);
    return null;
  }
}

const LoginPage: React.FC = () => {
  const { login } = useApp();
  const t = useTranslations();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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

  const handleLogin = async (event: React.MouseEvent<HTMLButtonElement>, name: string, email: string) => {
    createRipple(event);
    setIsLoggingIn(true);
    try {
        const fallbackAvatar = `https://api.multiavatar.com/${name.replace(/\s/g, '')}.svg`;
        const avatarPrompt = `A stylish, minimalist vector art avatar for a user from Alexandria, Egypt. The design should be modern and clean, with a color palette inspired by the deep blue Mediterranean sea and golden sands.`;
        const generatedAvatar = await generateImage(avatarPrompt);
        await login({ name, email, avatar: generatedAvatar || fallbackAvatar });
    } catch (error) {
        console.error("Login failed", error);
    } finally {
        setIsLoggingIn(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-primary to-base-dark-100 text-base-content-dark">
      <div className="text-center">
        <h1 className="text-5xl font-semibold tracking-wider text-white">{t.home_title_en}</h1>
        <h2 className="text-4xl font-light text-secondary">{t.home_title_ar}</h2>
        <p className="mt-4 text-lg font-extralight text-base-content-dark/80 max-w-md mx-auto">
            {t.slogan_1} <br/> {t.slogan_2}
        </p>
      </div>
      <div className="w-full max-w-sm mt-12">
        <button
          onClick={(e) => handleLogin(e, 'Alex User', 'alex.user@example.com')}
          disabled={isLoggingIn}
          className="ripple-container w-full flex items-center justify-center py-3 px-4 mb-3 bg-base-100 text-base-content font-semibold rounded-lg shadow-md hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {isLoggingIn ? <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin"></div> : <><GoogleIcon /> {t.signInGoogle}</>}
        </button>
        <button
          onClick={(e) => handleLogin(e, 'Alex User', 'alex.user@example.com')}
          disabled={isLoggingIn}
          className="ripple-container w-full flex items-center justify-center py-3 px-4 bg-[#3B5998] text-white font-semibold rounded-lg shadow-md hover:bg-[#35508a] transition-colors disabled:opacity-50"
        >
          {isLoggingIn ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <><FacebookIcon /> {t.signInFacebook}</>}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;