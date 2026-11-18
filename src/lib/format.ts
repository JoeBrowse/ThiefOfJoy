const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (d.getTime() - Date.now()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
  }
  return "just now";
}

export function fmtDate(date: string | Date | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", opts ?? { day: "numeric", month: "short", year: "numeric" }).format(
    typeof date === "string" ? new Date(date) : date,
  );
}

export function displayName(p: { username: string | null; display_name?: string | null } | null | undefined) {
  if (!p) return "[deleted]";
  return p.display_name || (p.username ? `@${p.username}` : "Member");
}
