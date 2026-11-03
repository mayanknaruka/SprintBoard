import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setSocket((prev) => {
        prev?.disconnect();
        return null;
      });
      return undefined;
    }

    const url = import.meta.env.VITE_SOCKET_URL || undefined;
    const instance = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    setSocket(instance);

    return () => {
      instance.disconnect();
    };
  }, [isAuthenticated, token]);

  const value = useMemo(() => ({ socket }), [socket]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext)?.socket ?? null;
}
