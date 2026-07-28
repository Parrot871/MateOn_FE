import { fetchBookmarkedEventIds, bookmarkEvent, unbookmarkEvent } from '@/api/events';
import { getAccessToken } from '@/api/tokenStorage';
import { useCallback, useEffect, useState } from 'react';

export function useBookmarkedEventIds() {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    getAccessToken().then((token) => {
      if (!token) return;
      fetchBookmarkedEventIds()
        .then((ids) => setBookmarkedIds(new Set(ids)))
        .catch((error) => console.error('북마크 목록 조회 실패:', error));
    });
  }, []);

  const toggleBookmark = useCallback((eventId: number, next: boolean) => {
    setBookmarkedIds((prev) => {
      const updated = new Set(prev);
      if (next) updated.add(eventId);
      else updated.delete(eventId);
      return updated;
    });

    const request = next ? bookmarkEvent(eventId) : unbookmarkEvent(eventId);
    request.catch((error) => {
      console.error('북마크 처리 실패:', error);
      setBookmarkedIds((prev) => {
        const reverted = new Set(prev);
        if (next) reverted.delete(eventId);
        else reverted.add(eventId);
        return reverted;
      });
    });
  }, []);

  return { bookmarkedIds, toggleBookmark };
}
