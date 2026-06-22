import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { PERSONAL_RELIEF_MONTHLY } from "./constants";

/** Format a number as Kenyan Shillings, e.g. "KES 12,500.00". */
export function formatKES(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? "-" : ""}KES ${formatted}`;
}

/** Format an ISO date string as DD/MM/YYYY. */
export function formatDate(iso: string | Date | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
}

/** Format an ISO date string as DD/MM/YYYY HH:MM. */
export function formatDateTime(iso: string | Date | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return "—";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(d)} ${hh}:${mm}`;
}

/** Relative time string, e.g. "3h ago". */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

/** Calculate age in years from a date of birth. */
export function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const diff = Date.now() - birth.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

/** Get initials from a full name. */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

/** Compute the 8-4-4 letter grade from a percentage mark. */
export function getGrade(marks: number): string {
  if (marks >= 80) return "A";
  if (marks >= 75) return "A-";
  if (marks >= 70) return "B+";
  if (marks >= 65) return "B";
  if (marks >= 60) return "B-";
  if (marks >= 55) return "C+";
  if (marks >= 50) return "C";
  if (marks >= 45) return "C-";
  if (marks >= 40) return "D+";
  if (marks >= 35) return "D";
  if (marks >= 30) return "D-";
  return "E";
}

/** KCSE points for a letter grade. */
export function getGradePoints(grade: string): number {
  const map: Record<string, number> = {
    A: 12,
    "A-": 11,
    "B+": 10,
    B: 9,
    "B-": 8,
    "C+": 7,
    C: 6,
    "C-": 5,
    "D+": 4,
    D: 3,
    "D-": 2,
    E: 1,
  };
  return map[grade] ?? 0;
}

/** Suggest a CBC rating from a percentage mark. */
export function getCBCRating(marks: number): "EE" | "ME" | "AE" | "BE" {
  if (marks >= 76) return "EE";
  if (marks >= 51) return "ME";
  if (marks >= 26) return "AE";
  return "BE";
}

/** Compute monthly PAYE using Kenya 2026 progressive bands (after reliefs). */
export function calculatePAYE(taxablePay: number): number {
  let tax = 0;
  const bands = [
    { limit: 24000, rate: 0.1 },
    { limit: 32333, rate: 0.25 },
    { limit: 500000, rate: 0.3 },
    { limit: 800000, rate: 0.325 },
    { limit: Infinity, rate: 0.35 },
  ];
  let prev = 0;
  for (const band of bands) {
    if (taxablePay > prev) {
      const taxable = Math.min(taxablePay, band.limit) - prev;
      tax += taxable * band.rate;
      prev = band.limit;
    } else break;
  }
  const net = tax - PERSONAL_RELIEF_MONTHLY;
  return Math.max(0, Math.round(net));
}

/** NSSF deduction: 6% Tier I + Tier II, capped at pensionable KES 36,000. */
export function calculateNSSF(grossPay: number): number {
  return Math.round(Math.min(grossPay, 36000) * 0.06);
}

/** SHIF deduction: 2.75% of gross. */
export function calculateSHIF(grossPay: number): number {
  return Math.round(grossPay * 0.0275);
}

/** Affordable Housing Levy: 1.5% of gross. */
export function calculateHousingLevy(grossPay: number): number {
  return Math.round(grossPay * 0.015);
}

export interface PayrollComputation {
  grossPay: number;
  paye: number;
  nssf: number;
  shif: number;
  housingLevy: number;
  totalDeductions: number;
  netPay: number;
}

/** Compute a full statutory payroll breakdown. */
export function computePayroll(
  basicSalary: number,
  houseAllowance: number,
  transportAllowance: number,
  otherAllowances: number,
  loanDeduction = 0,
  otherDeductions = 0,
): PayrollComputation {
  const grossPay = basicSalary + houseAllowance + transportAllowance + otherAllowances;
  const nssf = calculateNSSF(grossPay);
  const shif = calculateSHIF(grossPay);
  const housingLevy = calculateHousingLevy(grossPay);
  const paye = calculatePAYE(grossPay - nssf);
  const totalDeductions = paye + nssf + shif + housingLevy + loanDeduction + otherDeductions;
  const netPay = grossPay - totalDeductions;
  return { grossPay, paye, nssf, shif, housingLevy, totalDeductions, netPay };
}

/** Convert an integer amount to English words (for receipts). */
export function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const chunk = (n: number): string => {
    let s = "";
    if (n >= 100) {
      s += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      s += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) s += ones[n] + " ";
    return s;
  };
  let result = "";
  const scales = ["", "Thousand", "Million", "Billion"];
  let scaleIndex = 0;
  let n = Math.floor(num);
  const parts: string[] = [];
  while (n > 0) {
    const part = n % 1000;
    if (part > 0) parts.unshift(chunk(part).trim() + (scales[scaleIndex] ? " " + scales[scaleIndex] : ""));
    n = Math.floor(n / 1000);
    scaleIndex++;
  }
  result = parts.join(" ").trim();
  return result + " Shillings Only";
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/** Export an array of objects to a downloaded CSV file (client-side, no library). */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: { key: keyof T; label: string }[],
): void {
  if (typeof window === "undefined") return;
  const cols = headers ?? (data[0] ? Object.keys(data[0]).map((k) => ({ key: k as keyof T, label: k })) : []);
  const escape = (val: unknown) => {
    const s = val == null ? "" : String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const headerRow = cols.map((c) => escape(c.label)).join(",");
  const rows = data.map((row) => cols.map((c) => escape(row[c.key])).join(","));
  const csv = [headerRow, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Get all weeks (Monday-Sunday) between two dates. */
export function getWeeksInRange(startDate: Date, endDate: Date): { start: Date; end: Date; label: string }[] {
  const weeks = [];
  let current = new Date(startDate);
  // Rewind to Monday
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  current.setDate(diff);

  while (current <= endDate) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weeks.push({
      start: weekStart,
      end: weekEnd,
      label: `${formatDate(weekStart)} - ${formatDate(weekEnd)}`,
    });
    current.setDate(current.getDate() + 7);
  }
  return weeks;
}

/** Get all 7 days of a specific week starting from a given date. */
export function getDaysInWeek(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}
