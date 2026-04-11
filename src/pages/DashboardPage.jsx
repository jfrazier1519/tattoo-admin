import { PageHeader } from "../components/PageHeader";
import { COLLECTIONS } from "../firebase/collections";
import { isFirebaseConfigured } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { useCollectionSnapshot } from "../hooks/useCollectionSnapshot";

export default function DashboardPage() {
  const { user } = useAuth();
  const configured = isFirebaseConfigured();

  const clients = useCollectionSnapshot(COLLECTIONS.clients, {
    enabled: configured && Boolean(user),
  });
  const appointments = useCollectionSnapshot(COLLECTIONS.appointments, {
    enabled: configured && Boolean(user),
  });
  const booking = useCollectionSnapshot(COLLECTIONS.bookingRequests, {
    enabled: configured && Boolean(user),
  });

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of clients, appointments, and incoming booking requests."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Clients" value={configured && user ? clients.data.length : "—"} loading={clients.loading} />
        <StatCard
          label="Appointments"
          value={configured && user ? appointments.data.length : "—"}
          loading={appointments.loading}
        />
        <StatCard
          label="Booking requests"
          value={configured && user ? booking.data.length : "—"}
          loading={booking.loading}
        />
      </div>

      {(clients.error || appointments.error || booking.error) && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
          <p className="font-medium">Firestore</p>
          <p className="mt-1 opacity-90">
            {clients.error?.message || appointments.error?.message || booking.error?.message}
          </p>
          <p className="mt-2 text-xs opacity-80">
            Check collection names, security rules, and that you&apos;re signed in with an allowed admin
            account.
          </p>
        </div>
      )}

      {!configured && (
        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          After you add Firebase config and sign in, live counts will appear here.
        </p>
      )}
    </>
  );
}

function StatCard({ label, value, loading }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
        {loading ? "…" : value}
      </p>
    </div>
  );
}
