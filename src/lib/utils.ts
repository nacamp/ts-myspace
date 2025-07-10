import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// date
export function toDateFromYYYYMMDD(yyyymmdd: string): Date | null {
  if (!/^\d{8}$/.test(yyyymmdd)) return null; // 유효성 검사
  const yyyy = yyyymmdd.slice(0, 4);
  const mm = yyyymmdd.slice(4, 6);
  const dd = yyyymmdd.slice(6, 8);
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00+09:00`);
}

export function toYYYYMMDDfromDate(date: Date | null | undefined): string {
  console.log(date, date instanceof Date)
  if (!(date instanceof Date) || isNaN(date.getTime())) return "";
  //if (!date || isNaN(date.getTime())) return "";
  const options = {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  } as const;

  const parts = new Intl.DateTimeFormat("ko-KR", options).formatToParts(date);
  const yyyy = parts.find((p) => p.type === "year")?.value;
  const mm = parts.find((p) => p.type === "month")?.value;
  const dd = parts.find((p) => p.type === "day")?.value;
  return `${yyyy}${mm}${dd}`;
}
