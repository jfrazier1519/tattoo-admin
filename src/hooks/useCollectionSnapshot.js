import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase/config";
import { useAuth } from "../context/AuthContext";

/**
 * Live listener for a top-level collection. Requires signed-in user when Firebase is configured.
 */
export function useCollectionSnapshot(collectionName, options = {}) {
  const { enabled = true } = options;
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [snapLoading, setSnapLoading] = useState(true);

  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (!enabled || !db || !collectionName) {
      setSnapLoading(false);
      setData([]);
      setError(null);
      return;
    }
    if (!configured) {
      setSnapLoading(false);
      setData([]);
      setError(null);
      return;
    }
    if (authLoading) return;
    if (!user) {
      setSnapLoading(false);
      setData([]);
      setError(null);
      return;
    }

    setSnapLoading(true);
    setError(null);
    const q = query(collection(db, collectionName));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setData(rows);
        setSnapLoading(false);
      },
      (err) => {
        setError(err);
        setData([]);
        setSnapLoading(false);
      },
    );
    return unsub;
  }, [collectionName, enabled, configured, user, authLoading]);

  const loading = authLoading || snapLoading;

  return { data, error, loading };
}
