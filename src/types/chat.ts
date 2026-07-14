// types/chat.ts
export type RoomType = 'DM' | 'GROUP';

export interface ChatRoom {
  roomId: number;
  type: RoomType;
  teamId: number | null;
  title: string;
  partnerId: number | null;
  lastMessage: string | null;
  lastMessageAt: string | null; // "YYYY-MM-DDTHH:mm:ss"
  unreadCount: number;
}