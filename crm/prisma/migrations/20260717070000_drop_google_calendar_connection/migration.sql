-- Reverting the OAuth-based Google Calendar connection in favor of a
-- client-side "Add to Google Calendar" link — no server-stored credentials
-- needed at all.
DROP TABLE "GoogleCalendarConnection";
