import type { EventItem } from '@/api/events';
import { create } from 'zustand';

interface EventDetailStore {
  selectedEvent: EventItem | null;
  setSelectedEvent: (event: EventItem) => void;
}

export const useEventDetailStore = create<EventDetailStore>()((set) => ({
  selectedEvent: null,
  setSelectedEvent: (event) => set({ selectedEvent: event }),
}));
