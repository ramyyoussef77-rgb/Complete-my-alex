
import { User, MarketplaceItem, ChatMessage, ConversationTurn } from '../types';

// This is a mock/simulation of a Firebase service. In a real app,
// you would use the actual Firebase SDK here.

const MOCK_DELAY = 500;

// --- Authentication ---
export const firebaseLogin = async (user: Omit<User, 'uid'>): Promise<User> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const uid = `firebase-uid-${user.name.replace(/\s+/g, '-').toLowerCase()}`;
            resolve({ ...user, uid });
        }, MOCK_DELAY);
    });
};

// --- Firebase Storage ---
export const uploadImage = async (file: File): Promise<string> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const reader = new FileReader();
            reader.onload = (event) => {
                resolve(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }, MOCK_DELAY);
    });
};

// --- Firestore: Marketplace ---
export const getMarketplaceItems = async (limit: number, startAfter?: number): Promise<{ items: MarketplaceItem[], lastVisible: number | null }> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const stored = localStorage.getItem('marketplace_items');
            const allItems: MarketplaceItem[] = stored ? JSON.parse(stored) : [];
            
            const startIndex = startAfter ? allItems.findIndex(item => item.postedDate === startAfter) + 1 : 0;
            
            const paginatedItems = allItems.slice(startIndex, startIndex + limit);
            const lastVisible = paginatedItems.length > 0 ? paginatedItems[paginatedItems.length - 1].postedDate : null;

            resolve({ items: paginatedItems, lastVisible });
        }, MOCK_DELAY);
    });
};

export const addMarketplaceItem = async (item: Omit<MarketplaceItem, 'id'>): Promise<MarketplaceItem> => {
    return new Promise(resolve => {
         setTimeout(() => {
            const stored = localStorage.getItem('marketplace_items');
            const currentItems: MarketplaceItem[] = stored ? JSON.parse(stored) : [];
            const newItem = { ...item, id: `item-${Date.now()}` };
            const updatedItems = [newItem, ...currentItems];
            localStorage.setItem('marketplace_items', JSON.stringify(updatedItems));
            resolve(newItem);
        }, MOCK_DELAY);
    });
};

export const updateMarketplaceItem = async (itemId: string, updates: Partial<MarketplaceItem>): Promise<MarketplaceItem> => {
     return new Promise((resolve, reject) => {
         setTimeout(() => {
            const stored = localStorage.getItem('marketplace_items');
            const currentItems: MarketplaceItem[] = stored ? JSON.parse(stored) : [];
            let updatedItem: MarketplaceItem | null = null;
            const updatedItems = currentItems.map(item => {
                if (item.id === itemId) {
                    updatedItem = { ...item, ...updates };
                    return updatedItem;
                }
                return item;
            });
            if (updatedItem) {
                localStorage.setItem('marketplace_items', JSON.stringify(updatedItems));
                resolve(updatedItem);
            } else {
                reject(new Error("Item not found"));
            }
        }, MOCK_DELAY / 2);
    });
}

export const deleteMarketplaceItem = async (itemId: string): Promise<void> => {
    return new Promise(resolve => {
         setTimeout(() => {
            const stored = localStorage.getItem('marketplace_items');
            const currentItems: MarketplaceItem[] = stored ? JSON.parse(stored) : [];
            const updatedItems = currentItems.filter(item => item.id !== itemId);
            localStorage.setItem('marketplace_items', JSON.stringify(updatedItems));
            resolve();
        }, MOCK_DELAY / 2);
    });
}

// --- Firestore: Chat Rooms ---
export const getChatMessages = (room: string, callback: (messages: ChatMessage[]) => void): (() => void) => {
    const key = `chat_messages_${room}`;
    const handler = () => {
        const messages = localStorage.getItem(key);
        callback(messages ? JSON.parse(messages) : []);
    };
    
    // Initial fetch
    handler();

    // Simulate real-time listener
    window.addEventListener(`storage_change_${room}`, handler);
    
    // Return unsubscribe function
    return () => {
        window.removeEventListener(`storage_change_${room}`, handler);
    };
};

export const addChatMessage = async (room: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> => {
    return new Promise(resolve => {
        setTimeout(async () => {
            const key = `chat_messages_${room}`;
            const existing = await new Promise<ChatMessage[]>(res => {
                const data = localStorage.getItem(key);
                res(data ? JSON.parse(data) : []);
            });
            const newMessage: ChatMessage = {
                ...message,
                id: `msg-${Date.now()}`,
                timestamp: Date.now(),
            };
            const updated = [...existing, newMessage];
            localStorage.setItem(key, JSON.stringify(updated));

            // Dispatch event to notify other tabs/components
            window.dispatchEvent(new Event(`storage_change_${room}`));
            
            resolve(newMessage);
        }, 100);
    });
};

export const updateChatMessage = async (room: string, messageId: string, updates: Partial<ChatMessage>): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(async () => {
            const key = `chat_messages_${room}`;
            const existing = await new Promise<ChatMessage[]>(res => {
                const data = localStorage.getItem(key);
                res(data ? JSON.parse(data) : []);
            });
            const updated = existing.map(msg => 
                msg.id === messageId ? { ...msg, ...updates, status: 'sent' } : msg
            );
            localStorage.setItem(key, JSON.stringify(updated));
            window.dispatchEvent(new Event(`storage_change_${room}`));
            resolve();
        }, 50);
    });
};

// --- Firestore: AI Conversation History ---
export const getConversationHistory = async (userId: string): Promise<ConversationTurn[]> => {
     return new Promise(resolve => {
        setTimeout(() => {
            const history = localStorage.getItem(`conversation_history_${userId}`);
            resolve(history ? JSON.parse(history) : []);
        }, MOCK_DELAY);
    });
};

export const saveConversationHistory = async (userId: string, history: ConversationTurn[]): Promise<void> => {
     return new Promise(resolve => {
        setTimeout(() => {
            localStorage.setItem(`conversation_history_${userId}`, JSON.stringify(history));
            resolve();
        }, 100);
    });
};