import { useCallback, useRef } from "react";
import { Client } from "@stomp/stompjs";

const DEFAULT_WS_URL = "ws://localhost:15674/ws";
const DEFAULT_USER = "guest";
const DEFAULT_PASS = "guest";

export interface StompConfig {
  url?: string;
  user?: string;
  pass?: string;
}

export function useWebStomp(config: StompConfig = {}) {
  const url = config.url ?? (import.meta.env?.VITE_RABBITMQ_WEB_STOMP_URL || DEFAULT_WS_URL);
  const user = config.user ?? DEFAULT_USER;
  const pass = config.pass ?? DEFAULT_PASS;
  const clientRef = useRef<Client | null>(null);

  const connect = useCallback(
    (onConnect?: () => void, onError?: (e: Event) => void) => {
      if (clientRef.current) return clientRef.current;
      const client = new Client({
        brokerURL: url,
        connectHeaders: {
          login: user,
          passcode: pass,
        },
        reconnectDelay: 2000,
        onConnect: () => onConnect?.(),
        onStompError: (frame) => onError?.(new Event(frame?.headers?.message ?? "STOMP error")),
        onWebSocketError: (ev: Event) => onError?.(ev),
        onWebSocketClose: (ev: { code?: number; reason?: string }) => {
          const isNormalClose = ev?.code === 1000;
          if (!isNormalClose) {
            onError?.(new Event(ev?.reason ?? `WebSocket closed (code ${ev?.code ?? "?"})`));
          }
        },
      });
      client.activate();
      clientRef.current = client;
      return client;
    },
    [url, user, pass]
  );

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
  }, []);

  const subscribe = useCallback(
    (destination: string, callback: (body: string) => void) => {
      const client = clientRef.current;
      if (!client) return () => {};
      const sub = client.subscribe(destination, (message) => {
        callback(message.body);
      });
      return () => sub.unsubscribe();
    },
    []
  );

  const send = useCallback((destination: string, body: string) => {
    const client = clientRef.current;
    if (!client?.connected) return;
    client.publish({ destination, body });
  }, []);

  return { connect, disconnect, subscribe, send, clientRef };
}
