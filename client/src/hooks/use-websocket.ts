import { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '@shared/schema';

interface WebSocketMessage {
  type: string;
  message?: ChatMessage;
  [key: string]: any;
}

export function useWebSocket(userId: string | null) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = () => {
    if (!userId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws?userId=${userId}`;
    
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      setSocket(ws);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        
        if (data.type === 'chat' && data.message) {
          setMessages(prev => [...prev, data.message!]);
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setSocket(null);
      console.log('WebSocket disconnected');
      
      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  const sendMessage = (receiverId: string, message: string, messageType: string = 'text') => {
    if (socket && socket.readyState === WebSocket.OPEN && userId) {
      socket.send(JSON.stringify({
        type: 'chat',
        senderId: userId,
        receiverId,
        text: message,
        messageType,
      }));
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socket) {
      socket.close();
    }
  };

  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [userId]);

  return {
    isConnected,
    messages,
    sendMessage,
    connect,
    disconnect,
  };
}
