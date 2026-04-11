import { PageHeader } from "../components/PageHeader";
import { CollectionPreview } from "../components/CollectionPreview";
import { COLLECTIONS } from "../firebase/collections";
import { isFirebaseConfigured } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { useCollectionSnapshot } from "../hooks/useCollectionSnapshot";

export default function ClientsPage() {
  const { user } = useAuth();
  const configured = isFirebaseConfigured();
  const { data, error, loading } = useCollectionSnapshot(COLLECTIONS.clients, {
    enabled: configured && Boolean(user),
  });

  return (
    <>
      <PageHeader
        title="Clients"
        description="People you work with — contact info and notes will live here once modeled in Firestore."
        action={
          <button
            type="button"
            disabled
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Add client
          </button>
        }
      />

      <CollectionPreview
        collectionLabel={COLLECTIONS.clients}
        configured={configured}
        signedIn={Boolean(user)}
        loading={loading}
        error={error}
        rows={data}
        emptyMessage="No clients yet. Add documents in Firestore or use “Add client” once wired."
      />
    </>
  );
}
