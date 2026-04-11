import { isFirebaseConfigured } from "../firebase/config";

export function DevBanner() {
  if (isFirebaseConfigured()) return null;
  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-950 dark:text-amber-100">
      Firebase env vars missing — UI preview only. Add{" "}
      <code className="rounded bg-amber-500/20 px-1 py-0.5 font-mono">.env</code> (see{" "}
      <code className="rounded bg-amber-500/20 px-1 py-0.5 font-mono">.env.example</code>) to
      enable Auth and Firestore.
    </div>
  );
}
