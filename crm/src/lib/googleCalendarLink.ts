// Builds a Google Calendar "quick add" link — no credentials or server
// involvement needed. Opening it pre-fills a new event for the user to
// review and save themselves.
export function buildGoogleCalendarLink({
  title,
  description,
  start,
  end,
}: {
  title: string;
  description?: string;
  start: Date;
  end: Date;
}): string {
  const toGoogleDate = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toGoogleDate(start)}/${toGoogleDate(end)}`,
  });
  if (description) params.set("details", description);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
