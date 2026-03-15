import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import type { ContentType } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function relativeDate(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: sv });
}

export const contentTypeConfig: Record<
  ContentType,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    badgeClass: string;
    hex: string;
  }
> = {
  image: {
    label: "Bild",
    color: "text-type-image",
    bgColor: "bg-type-image/8",
    borderColor: "border-l-type-image",
    badgeClass: "badge-type-image",
    hex: "#d97706",
  },
  link: {
    label: "Länk",
    color: "text-type-link",
    bgColor: "bg-type-link/8",
    borderColor: "border-l-type-link",
    badgeClass: "badge-type-link",
    hex: "#0369a1",
  },
  article: {
    label: "Artikel",
    color: "text-type-article",
    bgColor: "bg-type-article/8",
    borderColor: "border-l-type-article",
    badgeClass: "badge-type-article",
    hex: "#047857",
  },
  thought: {
    label: "Tanke",
    color: "text-type-thought",
    bgColor: "bg-type-thought/8",
    borderColor: "border-l-type-thought",
    badgeClass: "badge-type-thought",
    hex: "#7c3aed",
  },
  youtube: {
    label: "YouTube",
    color: "text-type-youtube",
    bgColor: "bg-type-youtube/8",
    borderColor: "border-l-type-youtube",
    badgeClass: "badge-type-youtube",
    hex: "#dc2626",
  },
  linkedin: {
    label: "LinkedIn",
    color: "text-type-linkedin",
    bgColor: "bg-type-linkedin/8",
    borderColor: "border-l-type-linkedin",
    badgeClass: "badge-type-linkedin",
    hex: "#0a66c2",
  },
  instagram: {
    label: "Instagram",
    color: "text-type-instagram",
    bgColor: "bg-type-instagram/8",
    borderColor: "border-l-type-instagram",
    badgeClass: "badge-type-instagram",
    hex: "#db2777",
  },
  twitter: {
    label: "X/Twitter",
    color: "text-type-twitter",
    bgColor: "bg-type-twitter/8",
    borderColor: "border-l-type-twitter",
    badgeClass: "badge-type-twitter",
    hex: "#1d9bf0",
  },
};
