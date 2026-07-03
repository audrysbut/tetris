import { useState, useCallback, useRef, useEffect } from "react";
import Peer from "peerjs";
import type { DataConnection } from "peerjs";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export interface UsePeerConnectionReturn {
  peerId: string | null;
  connected: boolean;
  connectionError: string | null;
  roomCode: string | null;
  isHost: boolean;
  createRoom: () => Promise<string>;
  joinRoom: (code: string) => Promise<void>;
  send: (data: unknown) => void;
  onData: (callback: (data: unknown) => void) => () => void;
  disconnect: () => void;
}

export function usePeerConnection(): UsePeerConnectionReturn {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const dataCallbacksRef = useRef<Array<(data: unknown) => void>>([]);
  const connResolveRef = useRef<((value: void | PromiseLike<void>) => void) | null>(null);

  const cleanup = useCallback(() => {
    connRef.current?.close();
    connRef.current = null;
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setConnected(false);
    setPeerId(null);
    setRoomCode(null);
    setIsHost(false);
    setConnectionError(null);
  }, []);

  const send = useCallback((data: unknown) => {
    try {
      connRef.current?.send(data);
    } catch {
      // connection might be closed
    }
  }, []);

  const onData = useCallback((callback: (data: unknown) => void) => {
    dataCallbacksRef.current.push(callback);
    return () => {
      dataCallbacksRef.current = dataCallbacksRef.current.filter(
        (cb) => cb !== callback
      );
    };
  }, []);

  const setupConnection = useCallback((conn: DataConnection) => {
    connRef.current = conn;
    conn.on("open", () => {
      setConnected(true);
      connResolveRef.current?.();
      connResolveRef.current = null;
    });
    conn.on("data", (data: unknown) => {
      dataCallbacksRef.current.forEach((cb) => cb(data));
    });
    conn.on("close", () => {
      setConnected(false);
    });
  }, []);

  const createRoom = useCallback(async () => {
    cleanup();
    const code = generateRoomCode();
    return new Promise<string>((resolve, reject) => {
      const peer = new Peer(code);
      peerRef.current = peer;

      peer.on("open", () => {
        setPeerId(code);
        setRoomCode(code);
        setIsHost(true);
        resolve(code);
      });

      peer.on("connection", (conn: DataConnection) => {
        setupConnection(conn);
      });

      peer.on("error", (err) => {
        const msg = `${err.type}: ${err.message}`;
        setConnectionError(msg);
        reject(err);
      });
    });
  }, [cleanup, setupConnection]);

  const joinRoom = useCallback(
    async (code: string) => {
      cleanup();
      return new Promise<void>((resolve, reject) => {
        const peer = new Peer();
        peerRef.current = peer;

        connResolveRef.current = resolve;

        peer.on("open", () => {
          setPeerId(peer.id);
          const conn = peer.connect(code, { serialization: "json" });
          if (!conn) {
            reject(new Error("Failed to connect to peer"));
            return;
          }
          setupConnection(conn);
        });

        peer.on("error", (err) => {
          const msg = `${err.type}: ${err.message}`;
          setConnectionError(msg);
          reject(err);
        });

        setTimeout(() => {
          reject(new Error("Connection timed out"));
        }, 15000);
      });
    },
    [cleanup, setupConnection]
  );

  const disconnect = useCallback(() => {
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    peerId,
    connected,
    connectionError,
    roomCode,
    isHost,
    createRoom,
    joinRoom,
    send,
    onData,
    disconnect,
  };
}
