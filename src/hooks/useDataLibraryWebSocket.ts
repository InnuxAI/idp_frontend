'use client';

import { useEffect, useRef, useCallback } from 'react';
import { DataLibraryEntry } from '@/services/api';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL ||
    (typeof window !== 'undefined'
        ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8000`
        : 'ws://localhost:8000');

interface WebSocketMessage {
    event: 'job_created' | 'status_changed' | 'job_deleted';
    data: any;
}

interface UseDataLibraryWebSocketOptions {
    onJobCreated?: (data: Partial<DataLibraryEntry>) => void;
    onStatusChanged?: (data: { id: number; status: string; extracted_data?: any; error_message?: string }) => void;
    onJobDeleted?: (data: { id: number }) => void;
    enabled?: boolean;
}

/**
 * React hook for real-time Data Library updates via WebSocket.
 */
export function useDataLibraryWebSocket({
    onJobCreated,
    onStatusChanged,
    onJobDeleted,
    enabled = true
}: UseDataLibraryWebSocketOptions) {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isConnectingRef = useRef(false);

    // Use refs for callbacks to avoid reconnecting when callbacks change
    const callbacksRef = useRef({ onJobCreated, onStatusChanged, onJobDeleted });
    callbacksRef.current = { onJobCreated, onStatusChanged, onJobDeleted };

    useEffect(() => {
        if (!enabled || typeof window === 'undefined') return;

        // Prevent multiple simultaneous connection attempts
        if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        const connect = () => {
            if (wsRef.current?.readyState === WebSocket.OPEN) return;

            isConnectingRef.current = true;
            const wsUrl = `${WS_BASE_URL}/api/ws/data-library`;
            console.log('📡 Connecting to WebSocket:', wsUrl);

            try {
                const ws = new WebSocket(wsUrl);
                wsRef.current = ws;

                ws.onopen = () => {
                    console.log('✅ WebSocket connected');
                    isConnectingRef.current = false;
                };

                ws.onmessage = (event) => {
                    // Skip pong responses
                    if (event.data === 'pong') return;

                    try {
                        const message: WebSocketMessage = JSON.parse(event.data);
                        console.log('📨 WebSocket message:', message.event, message.data);

                        const { onJobCreated, onStatusChanged, onJobDeleted } = callbacksRef.current;

                        switch (message.event) {
                            case 'job_created':
                                onJobCreated?.(message.data);
                                break;
                            case 'status_changed':
                                onStatusChanged?.(message.data);
                                break;
                            case 'job_deleted':
                                onJobDeleted?.(message.data);
                                break;
                        }
                    } catch (e) {
                        console.warn('Failed to parse WebSocket message:', e);
                    }
                };

                ws.onclose = () => {
                    console.log('🔌 WebSocket disconnected');
                    wsRef.current = null;
                    isConnectingRef.current = false;

                    // Only reconnect if still enabled and not unmounting
                    if (enabled) {
                        reconnectTimeoutRef.current = setTimeout(connect, 3000);
                    }
                };

                ws.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    isConnectingRef.current = false;
                };

            } catch (error) {
                console.error('Failed to create WebSocket:', error);
                isConnectingRef.current = false;
            }
        };

        connect();

        // Ping every 30s to keep connection alive
        pingIntervalRef.current = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send('ping');
            }
        }, 30000);

        // Cleanup on unmount
        return () => {
            console.log('🧹 Cleaning up WebSocket');

            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
                pingIntervalRef.current = null;
            }

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }

            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [enabled]); // Only depend on enabled, not callbacks

    return {
        isConnected: wsRef.current?.readyState === WebSocket.OPEN
    };
}
