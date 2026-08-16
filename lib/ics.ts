export function downloadIcs(
  name: string,
  ticker: string,
  date: string,
  label: string
) {
  const dt = date.replace(/-/g, "");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//starter-project//EN",
    "BEGIN:VEVENT",
    `UID:${ticker}-${dt}-${label}@starter-project`,
    `DTSTART;VALUE=DATE:${dt}`,
    `SUMMARY:${ticker} — ${label}`,
    `DESCRIPTION:${name} (${label}) via SEC EDGAR`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ticker}-${label}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
