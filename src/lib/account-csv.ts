import type { ActivityRow } from "@/lib/account-activity";
import { EVENT_LABELS } from "@/lib/account-activity";
import type { SessionRow } from "@/lib/account-sessions";
import { labelFromUserAgent } from "@/lib/account-sessions";

/** Escapes a single CSV cell. Guards against spreadsheet formula injection. */
function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(cell).join(","), ...rows.map((r) => r.map(cell).join(","))];
  // CRLF + BOM so Excel opens UTF-8 correctly.
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export function activityToCsv(rows: ActivityRow[]): string {
  return toCsv(
    ["Date", "Event", "Event code", "Detail", "Device"],
    rows.map((a) => [
      new Date(a.created_at).toISOString(),
      EVENT_LABELS[a.event] ?? a.event,
      a.event,
      a.detail ?? "",
      a.device ?? "",
    ]),
  );
}

export function sessionsToCsv(rows: SessionRow[]): string {
  return toCsv(
    ["Device", "Current", "IP", "Started", "Last active", "Expires", "User agent", "Session ID"],
    rows.map((s) => [
      labelFromUserAgent(s.user_agent),
      s.is_current ? "yes" : "no",
      s.ip ?? "",
      new Date(s.created_at).toISOString(),
      s.refreshed_at ? new Date(s.refreshed_at).toISOString() : "",
      s.not_after ? new Date(s.not_after).toISOString() : "",
      s.user_agent ?? "",
      s.id,
    ]),
  );
}

export function csvFilename(kind: string): string {
  return `grounds-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
}
