import { useEffect, useRef } from 'react';

interface EventPayload {
  event: string;
  payload: any;
}

export function useStreamSocket(
  identity: string,
  onEvent: (event: string, payload: any) => void
) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!identity) return;
    const wsUrl = process.env.NEXT_PUBLIC_API_URL!.replace(/^http/, 'ws') + `/stream/ws/${identity}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[WebSocket] Connected:', identity);
    };

    ws.onmessage = (msg) => {
      try {
        const { event, payload }: EventPayload = JSON.parse(msg.data);
        onEvent(event, payload);
      } catch (err) {
        console.warn('[WebSocket] Message parse error:', err);
      }
    };

    ws.onclose = () => {
      console.log('[WebSocket] Disconnected:', identity);
    };

    ws.onerror = (err) => {
      console.error('[WebSocket] Error:', err);
    };

    socketRef.current = ws;
    return () => {
      ws.close();
    };
  }, [identity]);

  const emit = (event: string, payload: any = {}) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ event, payload }));
    } else {
      console.warn('[WebSocket] Not connected');
    }
  };

  return { emit };
}