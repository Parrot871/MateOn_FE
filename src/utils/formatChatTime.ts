// utils/formatChatTime.ts
export function formatChatTime(isoString: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const hours = date.getHours();
  const period = hours < 12 ? '오전' : '오후';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${period} ${displayHour}:${minutes}`;
}