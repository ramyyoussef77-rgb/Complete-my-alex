
export interface ConversationTurn {
  type: 'user' | 'assistant' | 'system' | 'tool';
  text: string;
  isPartial?: boolean;
  grounding?: GroundingChunk[];
  suggestions?: string[];
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  }
}

export interface SocialPost {
  author: string;
  content: string;
  url: string;
  platform: string;
  sentiment?: 'Positive' | 'Neutral' | 'Negative';
  tags?: string[];
  imageUrl?: string;
}

export interface WeatherDay {
  day: string;
  high: string;
  low: string;
  condition: string;
}

export interface WeatherData {
  current: {
    temperature: string;
    condition: string;
    location: string;
  };
  forecast: WeatherDay[];
}


export interface TrafficData {
  overallStatus: string;
  roads: {
    roadName: string;
    status: string;
  }[];
}

export interface NewsData {
  headline: string;
  source: string;
  url: string;
}

export interface HistoricalPlace {
  name: string;
  description: string;
  era: string;
  modernImageUrl: string;
  ancientImageUrl: string;
  narrative?: string;
  coordinates?: { lat: number; lng: number };
}

export interface MarketplaceItem {
  id: string;
  title: string;
  price: string;
  description: string;
  imageUrl: string;
  category?: string;
  tags?: string[];
  phone?: string;
  isLocal?: boolean;
  postedDate: number;
  userId?: string;
  sellerName?: string;
  sellerAvatar?: string;
}

export interface LocalEvent {
  name: string;
  date: string; // Keep for display, but use startDate/endDate for logic
  location: string;
  description: string;
  url: string;
  category?: 'Music' | 'Art' | 'Food' | 'Sports' | 'Community' | 'Other';
  imageUrl?: string;
  coordinates?: { lat: number; lng: number };
  startDate?: string; // ISO 8601 format
  endDate?: string;   // ISO 8601 format
}

export interface LocalService {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  url: string;
  coordinates?: { lat: number; lng: number };
  distance?: string;
  starRating?: number;
  priceLevel?: string;
  isOpenNow?: boolean;
  openingHours?: { day: string; hours: string }[];
  reviewSummary?: string;
  photoUrls?: string[];
}


export interface User {
  uid: string;
  name: string;
  email: string;
  avatar: string;
}

export interface ChatMessage {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  status?: 'pending' | 'sent' | 'failed';
  reactions?: Record<string, string[]>; // emoji -> [username]
  imageUrl?: string;
  imageDescription?: string;
}

export interface ChatRoomInfo {
    name: string;
    description: string;
    imageUrl: string;
}

export interface Notification {
  id: string;
  message: string;
  page: string;
  read: boolean;
}

export type Theme = 'light' | 'dark';
export type Language = 'en' | 'ar';
export interface Voice {
  name: string;
  value: string;
}

export interface ProTip {
    tip: string;
}

export interface AlexandriaPhoto {
    imageUrl: string;
    description: string;
    url: string;
}

export interface EmergencyContact {
  service: string;
  number: string;
  icon: 'police' | 'ambulance' | 'fire';
}

export interface DirectoryContact {
  name: string;
  department: string;
  phone: string;
  address?: string;
  email?: string;
}
