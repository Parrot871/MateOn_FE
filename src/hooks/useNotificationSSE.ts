import { useEffect, useRef, useState } from 'react';
import EventSource from 'react-native-sse';
import { NotificationResponseDTO } from '../api/notification';
import { getAccessToken } from '../api/tokenStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export function useNotificationSSE() {
  const [notifications, setNotifications] = useState<NotificationResponseDTO[]>([]);
  const esRef = useRef<EventSource<'connect' | 'notification'> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      const accessToken = await getAccessToken();
      if (!accessToken || cancelled) return;

      const es = new EventSource<'connect' | 'notification'>(
        `${API_BASE_URL}/api/notifications/subscribe`, 
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      esRef.current = es;

      es.addEventListener('connect', (event) => {
        console.log('SSE 연결됨:', event.data);
      });

      es.addEventListener('notification', (event) => {
        if (!event.data) return;
        const newNotification: NotificationResponseDTO = JSON.parse(event.data);
        setNotifications((prev) => [newNotification, ...prev]);
      });

      es.addEventListener('error', (event) => {
        console.warn('SSE 에러:', event);
      });
    }

    connect();

    return () => {
      cancelled = true;
      esRef.current?.close();
      esRef.current = null;
    };
  }, []);

  return { notifications, setNotifications };
}