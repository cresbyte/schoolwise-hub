import type { TermEventCategory } from "./types";

export const TERM_EVENT_COLORS: Record<TermEventCategory, string> = {
  exam:     "#1565C0",   // deep blue
  holiday:  "#2E7D32",   // green
  closure:  "#424242",   // dark grey
  meeting:  "#6A1B9A",   // purple
  activity: "#E65100",   // orange
  trip:     "#00695C",   // teal
  deadline: "#C62828",   // red
  other:    "#37474F",   // blue-grey
};

export const TERM_EVENT_ICONS: Record<TermEventCategory, string> = {
  exam: "📝", 
  holiday: "🌴", 
  closure: "🏫", 
  meeting: "👥",
  activity: "⭐", 
  trip: "🚌", 
  deadline: "📅", 
  other: "📌"
};
