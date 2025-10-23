import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SocialPost } from '../types';
import SocialBuzzCard from './SocialBuzzCard';
import { useTranslations } from '../hooks/useTranslations';
import Header from './Header';
import { useApp } from '../hooks/useApp';
import { useAutoTranslator } from '../hooks/useAutoTranslator';
import { SkeletonCard } from './SkeletonLoader';
import DailyBuzzSummaryCard from './DailyBuzzSummaryCard';

interface SocialBuzzPageProps {
  openNav: () => void;
}

const POSTS_PER_PAGE = 12;

const SocialBuzzPage: React.FC<SocialBuzzPageProps> = ({ openNav }) => {
  const { contentVersion } = useApp();
  const t = useTranslations();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mainRef = useRef<HTMLElement>(null);
  const observer = useRef<IntersectionObserver>();

  const { translatedData: translatedPosts } = useAutoTranslator(posts);

  const fetchSocialBuzz = useCallback(async (pageNum: number, isRefresh: boolean = false) => {
    if (pageNum === 1) setIsLoading(true);
    else setIsFetchingMore(true);
    setError(null);
    
    try {
      if (!process.env.API_KEY) throw new Error("API key is not configured.");
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        Find recent social media buzz about Alexandria, Egypt.
        Search for what people are saying online on public platforms. Prioritize posts that include images. Look for posts with hashtags #Alexandria or #الإسكندرية.
        Return page ${pageNum} of the ${POSTS_PER_PAGE} most relevant and interesting posts. Avoid returning duplicate posts from previous pages.
        Your response MUST be ONLY a valid JSON array of objects. Do not include any text, explanations, or markdown code blocks.
        Each object in the array must have: "author"(string), "content"(string), "url"(string), "platform"(string), "imageUrl"(string URL or empty string), "sentiment"(one of 'Positive', 'Neutral', 'Negative'), and "tags"(string array of 1-3 keywords).
        If no more posts are found, return an empty JSON array: [].
      `;
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { tools: [{ googleSearch: {} }] } });
      const sanitizedText = response.text.trim().replace(/^```json\s*|```$/g, '');
      
      const newPosts: SocialPost[] = JSON.parse(sanitizedText);
      
      setHasMore(newPosts.length === POSTS_PER_PAGE);
      setPosts(prev => isRefresh ? newPosts : [...prev, ...newPosts]);
      
      if (isRefresh) {
        const tags = new Set(newPosts.flatMap(p => p.tags || []));
        setAllTags(Array.from(tags).slice(0, 10)); // Limit to 10 most common tags for UI
      } else {
        setAllTags(prev => {
          const newTags = new Set([...prev, ...newPosts.flatMap(p => p.tags || [])]);
          return Array.from(newTags).slice(0, 10);
        });
      }

    } catch (e) {
      console.error("Failed to fetch social buzz:", e);
      setError(t.error_social_buzz);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [t.error_social_buzz]);

  useEffect(() => {
    fetchSocialBuzz(1, true); // Initial fetch
  }, [fetchSocialBuzz, contentVersion]);
  
  const lastPostElementRef = useCallback(node => {
    if (isLoading || isFetchingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => {
          const nextPage = prev + 1;
          fetchSocialBuzz(nextPage);
          return nextPage;
        });
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, isFetchingMore, hasMore, fetchSocialBuzz]);

  const handleRefresh = () => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
    setActiveTag(null);
    fetchSocialBuzz(1, true);
  };
  
  const filteredPosts = useMemo(() => {
      if (!activeTag) return translatedPosts;
      return translatedPosts?.filter(p => p.tags?.includes(activeTag));
  }, [translatedPosts, activeTag]);

  return (
    <div className="relative flex-1 w-full bg-base-dark-100 text-base-content-dark p-4 pt-20 flex flex-col">
      <Header openNav={openNav} />
      
      <main ref={mainRef} className="flex-1 overflow-y-auto pr-2">
        <DailyBuzzSummaryCard />
        
        <div className="sticky top-0 bg-base-dark-100 py-2 z-10 flex flex-wrap items-center gap-2 mb-4">
          <button onClick={() => setActiveTag(null)} className={`px-3 py-1 text-sm rounded-full font-semibold transition-colors ${!activeTag ? 'bg-secondary text-base-dark-100' : 'bg-base-dark-200 hover:bg-base-dark-300'}`}>{t.all_posts}</button>
          {allTags.map(tag => (
            <button key={tag} onClick={() => setActiveTag(tag)} className={`px-3 py-1 text-sm rounded-full font-semibold transition-colors ${activeTag === tag ? 'bg-secondary text-base-dark-100' : 'bg-base-dark-200 hover:bg-base-dark-300'}`}>#{tag}</button>
          ))}
          <button onClick={handleRefresh} className="p-2 ml-auto rounded-full bg-base-dark-200 hover:bg-base-dark-300 transition-transform active:scale-90" title={t.refresh}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(POSTS_PER_PAGE)].map((_, i) => <SkeletonCard key={i} className="h-48" />)}
          </div>
        ) : error ? (
          <div className="flex flex-col justify-center items-center h-full text-center">
            <p className="text-5xl mb-4">🔌</p>
            <p className="text-red-400 font-semibold">{error}</p>
            <button onClick={handleRefresh} className="mt-4 px-4 py-2 bg-secondary text-base-dark-100 font-bold rounded-lg hover:opacity-90 transition-opacity">{t.retry}</button>
          </div>
        ) : filteredPosts?.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-center">
            <p className="text-5xl mb-4">🤫</p>
            <p className="text-xl font-semibold text-base-content-dark/70">{t.no_posts_found_friendly}</p>
            <p className="text-base-content-dark/50 mt-1">{t.no_posts_found_suggestion}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPosts?.map((post, index) => {
                 const card = (
                    <div className="animate-fade-in-up" style={{ animationDelay: `${(index % POSTS_PER_PAGE) * 50}ms` }}>
                        <SocialBuzzCard post={post} onTagClick={setActiveTag} />
                    </div>
                 );
                 if (filteredPosts.length === index + 1) {
                     return <div ref={lastPostElementRef} key={`${post.url}-${index}`}>{card}</div>
                 }
                 return <div key={`${post.url}-${index}`}>{card}</div>
              })}
            </div>
            <div className="text-center py-8 text-base-content-dark/60">
                {isFetchingMore && (
                    <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-current/50 border-t-secondary rounded-full animate-spin mr-2"></div>
                        {t.loading_more}
                    </div>
                )}
                {!hasMore && !isFetchingMore && t.no_more_posts}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default SocialBuzzPage;