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
  // console.log(date, date instanceof Date)
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

// export const defaultYyyymm = (() => {
//   const now = new Date();
//   const year = now.getFullYear();
//   const month = String(now.getMonth() + 1).padStart(2, "0");
//   return `${year}${month}`;
// })();

// export const defaultYyyymmdd = (() => {
//   const now = new Date();
//   const year = now.getFullYear();
//   const month = String(now.getMonth() + 1).padStart(2, "0");
//   return `${year}${month}`;
// })();
const formatDate = (date: Date, withDay = false) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return withDay ? `${year}${month}${day}` : `${year}${month}`;
};

export const defaultYyyymm = formatDate(new Date(), false);
export const defaultYyyymmdd = formatDate(new Date(), true);



export function getSearchDate(dateStr: string, type: "start" | "end"): Date {
  const year = Number(dateStr.slice(0, 4));
  const month = Number(dateStr.slice(4, 6)) - 1; // JS는 0-indexed month

  let date: Date;

  if (dateStr.length === 6) {
    // yyyyMM 형식: 월 단위
    if (type === "start") {
      date = new Date(Date.UTC(year, month, 1, -9, 0, 0)); // KST 00:00
    } else {
      date = new Date(Date.UTC(year, month + 1, 1, -9, 0, 0)); // 다음 달 KST 00:00
    }
  } else if (dateStr.length === 8) {
    const day = Number(dateStr.slice(6, 8));
    if (type === "start") {
      date = new Date(Date.UTC(year, month, day, -9, 0, 0)); // 당일 KST 00:00
    } else {
      date = new Date(Date.UTC(year, month, day + 1, -9, 0, 0)); // 다음날 KST 00:00
    }
  } else {
    throw new Error("Invalid date format: must be yyyyMM or yyyyMMdd");
  }

  return date;
}