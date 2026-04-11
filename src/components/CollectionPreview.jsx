/** Generic read-only preview of a Firestore collection for early scaffolding. */
export function CollectionPreview({
  collectionLabel,
  configured,
  signedIn,
  loading,
  error,
  rows,
  emptyMessage,
}) {
  if (!configured) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 p-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-400">
        Configure Firebase to load{" "}
        <code className="font-mono text-zinc-800 dark:text-zinc-200">{collectionLabel}</code>.
      </div>
    );
  }
  if (!signedIn) {
    return null;
  }
  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
        Loading…
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
        {error.message}
      </div>
    );
  }
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-3 font-medium">ID</th>
            <th className="px-4 py-3 font-medium">Document</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {rows.map((row) => (
            <tr key={row.id} className="text-zinc-800 dark:text-zinc-200">
              <td className="px-4 py-3 font-mono text-xs text-zinc-500">{row.id}</td>
              <td className="max-w-md truncate px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                {JSON.stringify({ ...row, id: undefined })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
