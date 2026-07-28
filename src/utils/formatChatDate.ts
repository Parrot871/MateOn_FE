// utils/formatChatDate.ts
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export function formatChatDate(isoString: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayLabel = DAY_LABELS[date.getDay()];
  return `${year}년 ${month}월 ${day}일 ${dayLabel}요일`;
}

export function isSameDay(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const dateA = new Date(a);
  const dateB = new Date(b);
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}
