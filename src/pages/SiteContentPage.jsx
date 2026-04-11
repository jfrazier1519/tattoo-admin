import { PageHeader } from "../components/PageHeader";
import { CollectionPreview } from "../components/CollectionPreview";
import { COLLECTIONS } from "../firebase/collections";
import { isFirebaseConfigured } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { useCollectionSnapshot } from "../hooks/useCollectionSnapshot";

export default function SiteContentPage() {
  const { user } = useAuth();
  const configured = isFirebaseConfigured();
  const { data, error, loading } = useCollectionSnapshot(COLLECTIONS.siteContent, {
    enabled: configured && Boolean(user),
  });

  return (
    <>
      <PageHeader
        title="Site & content"
        description="Eventually replaces hardcoded portfolio/site data: copy, sections, and image references. S3 uploads will plug in here."
        action={
          <button
            type="button"
            disabled
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            New block
          </button>
        }
      />

      <p className="mb-6 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        Collection name is a placeholder (
        <code className="font-mono text-zinc-800 dark:text-zinc-200">{COLLECTIONS.siteContent}</code>
        ). You may prefer one doc per section, a single config doc, or subcollections — decide when you
        model the public site.
      </p>

      <CollectionPreview
        collectionLabel={COLLECTIONS.siteContent}
        configured={configured}
        signedIn={Boolean(user)}
        loading={loading}
        error={error}
        rows={data}
        emptyMessage="No CMS documents yet. Create this collection in Firestore when you’re ready to migrate off static data."
      />
    </>
  );
}
