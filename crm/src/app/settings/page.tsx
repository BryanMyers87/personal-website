import { CalendarCheck, CalendarX } from "lucide-react";
import { getConnection } from "@/lib/googleCalendar";
import { disconnectGoogleCalendarAction } from "@/actions/googleCalendar";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import DeleteButton from "@/components/DeleteButton";

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "Google didn't return an authorization code. Try again.",
  no_refresh_token: "Google didn't grant offline access. Try again and make sure to approve the consent screen.",
  oauth_failed: "Something went wrong connecting to Google. Try again.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const { connected, error } = await searchParams;
  const connection = await getConnection();

  return (
    <div>
      <PageHeader title="Settings" description="Integrations for the CRM." />

      {connected && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          Google Calendar connected.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {ERROR_MESSAGES[error] ?? "Couldn't connect Google Calendar. Try again."}
        </div>
      )}

      <Card className="max-w-xl p-6">
        <div className="flex items-center gap-3">
          {connection ? (
            <CalendarCheck className="text-emerald-600 dark:text-emerald-400" size={20} />
          ) : (
            <CalendarX className="text-zinc-400" size={20} />
          )}
          <div>
            <p className="font-medium">Google Calendar</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {connection ? `Connected${connection.email ? ` as ${connection.email}` : ""}` : "Not connected"}
            </p>
          </div>
        </div>

        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          When connected, checking off a touch point on a contact automatically creates a 5-minute event on your
          calendar for the next touch point in the cadence, timed for about the same time of day.
        </p>

        <div className="mt-4">
          {connection ? (
            <DeleteButton
              action={disconnectGoogleCalendarAction}
              confirmText="Disconnect Google Calendar? Touch points will stop creating reminder events until you reconnect."
              label="Disconnect"
            />
          ) : (
            <ButtonLink href="/api/google/connect">Connect Google Calendar</ButtonLink>
          )}
        </div>
      </Card>
    </div>
  );
}
