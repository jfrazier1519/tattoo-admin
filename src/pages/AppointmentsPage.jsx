import { PageHeader } from "../components/PageHeader";
import { CollectionPreview } from "../components/CollectionPreview";
import { COLLECTIONS } from "../firebase/collections";
import { isFirebaseConfigured } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { useCollectionSnapshot } from "../hooks/useCollectionSnapshot";

export default function AppointmentsPage() {
  const { user } = useAuth();
  const configured = isFirebaseConfigured();
  const { data, error, loading } = useCollectionSnapshot(COLLECTIONS.appointments, {
    enabled: configured && Boolean(user),
  });

  return (
    <>
      <PageHeader
        title="Appointments"
        description="Scheduled work — dates, duration, and status. Calendar sync comes in a later phase."
        action={
          <button
            type="button"
            disabled
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            New appointment
          </button>
        }
      />

      <CollectionPreview
        collectionLabel={COLLECTIONS.appointments}
        configured={configured}
        signedIn={Boolean(user)}
        loading={loading}
        error={error}
        rows={data}
        emptyMessage="No appointments yet. Shape documents to match your agreed schema, then add forms here."
      />
    </>
  );
}
