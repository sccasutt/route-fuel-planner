
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export function useWahooAuthPopup({
  onConnect,
  onError,
}: {
  onConnect: () => void;
  onError: (desc: string) => void;
}) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [authWindow, setAuthWindow] = useState<Window | null>(null);

  // Initial connect state from localStorage
  useEffect(() => {
    const hasWahooToken = localStorage.getItem("wahoo_token");
    if (hasWahooToken) setIsConnected(true);
  }, []);

  // Handle popup message events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'wahoo-connected') {
        setIsConnecting(false);
        setStatusMessage("");
        setIsConnected(true);
        localStorage.setItem("wahoo_token", "connected");
        onConnect();
        if (authWindow && !authWindow.closed) authWindow.close();
      }
      if (event.data && event.data.type === 'wahoo-error') {
        setIsConnecting(false);
        setStatusMessage("");
        onError(event.data.description || event.data.error || "Failed to connect to Wahoo");
        if (authWindow && !authWindow.closed) authWindow.close();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onConnect, onError, authWindow]);

  // Monitor popup closed
  useEffect(() => {
    let popupCheckInterval: number | undefined;
    if (isConnecting && authWindow) {
      popupCheckInterval = window.setInterval(() => {
        if (authWindow.closed) {
          setIsConnecting(false);
          setStatusMessage("");
          clearInterval(popupCheckInterval);
        }
      }, 500);
    }
    return () => {
      if (popupCheckInterval) clearInterval(popupCheckInterval);
    };
  }, [isConnecting, authWindow]);

  const disconnect = useCallback(() => {
    localStorage.removeItem("wahoo_token");
    setIsConnected(false);
  }, []);

  return {
    isConnecting,
    setIsConnecting,
    statusMessage,
    setStatusMessage,
    isConnected,
    setIsConnected,
    authWindow,
    setAuthWindow,
    disconnect,
  };
}
