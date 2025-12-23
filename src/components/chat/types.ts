import { Document } from '@/services/api';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    sources?: any[];
    imageSources?: any[];
    steps?: any[];
    isStreaming?: boolean;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    updatedAt: Date;
}
