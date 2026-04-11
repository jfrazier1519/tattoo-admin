import { PageHeader } from "../components/PageHeader";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Integrations and account options. Google Calendar connection is planned for a later phase — not implemented here yet."
      />

      <div className="max-w-lg space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Google Calendar</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Connect Calendar from here when you reach Phase 7. Until then, leave this as a stub.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-medium text-zinc-400 dark:border-zinc-700 dark:bg-zinc-950"
        >
          Connect Google Calendar (coming later)
        </button>
      </div>
    </>
  );
}
