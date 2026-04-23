import { useEffect, useMemo, useState } from "react";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { PageHeader } from "../components/PageHeader";
import { COLLECTIONS } from "../firebase/collections";
import { db, isFirebaseConfigured, storage } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { useCollectionSnapshot } from "../hooks/useCollectionSnapshot";

function getImageFromBlock(block) {
  const payload = block?.payload;
  if (payload?.imageUrl) return payload.imageUrl;
  if (payload?.image) return payload.image;
  if (payload?.url) return payload.url;
  if (typeof block?.image === "string") return block.image;
  return "";
}

function getEditableText(block) {
  const payload = block?.payload || {};
  if (typeof payload.text === "string") return payload.text;
  if (typeof payload.description === "string") return payload.description;
  if (typeof block?.body === "string") return block.body;
  return "";
}

function payloadToPairs(block) {
  const payload = block?.payload ?? {};
  const entries = Object.entries(payload)
    .filter(([key]) => key !== "imageUrl")
    .map(([key, value]) => ({
      key,
      value: typeof value === "string" ? value : JSON.stringify(value),
    }));

  if (entries.length === 0) {
    const fallback = getEditableText(block);
    if (fallback) return [{ key: "text", value: fallback }];
  }
  return entries;
}

function pairsToPayload(pairs) {
  const next = {};
  pairs.forEach((pair) => {
    const key = pair.key.trim();
    if (!key) return;
    next[key] = pair.value;
  });
  return next;
}

function keyToLabel(key) {
  if (!key) return "Field";
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function tryParseJson(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith("[") && !trimmed.startsWith("{")) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function toForm(block) {
  return {
    id: block.id,
    slotKey: block.slotKey ?? block.id,
    pageKey: block.pageKey ?? "",
    blockType: block.blockType ?? "section",
    isPublished: Boolean(block.isPublished),
    imageUrl: getImageFromBlock(block),
    payloadPairs: payloadToPairs(block),
  };
}

export default function SiteContentPage() {
  const { user } = useAuth();
  const configured = isFirebaseConfigured();
  const { data, error, loading } = useCollectionSnapshot(COLLECTIONS.contentBlocks, {
    enabled: configured && Boolean(user),
  });

  const [activePage, setActivePage] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState({
    id: "",
    slotKey: "",
    pageKey: "",
    blockType: "",
    isPublished: true,
    imageUrl: "",
    payloadPairs: [],
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");

  const rows = useMemo(() => {
    const list = [...(data || [])];
    list.sort((a, b) => (a.slotKey || a.id).localeCompare(b.slotKey || b.id));
    return list;
  }, [data]);

  const pageTabs = useMemo(() => {
    const keys = Array.from(new Set(rows.map((row) => row.pageKey).filter(Boolean)));
    return ["all", ...keys];
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (activePage === "all") return rows;
    return rows.filter((row) => row.pageKey === activePage);
  }, [rows, activePage]);

  useEffect(() => {
    if (!filteredRows.length) {
      setSelectedId("");
      return;
    }
    const stillExists = filteredRows.some((row) => row.id === selectedId);
    const next = stillExists ? filteredRows.find((row) => row.id === selectedId) : filteredRows[0];
    if (next && next.id !== selectedId) {
      setSelectedId(next.id);
      setForm(toForm(next));
    }
  }, [filteredRows, selectedId]);

  function chooseBlock(block) {
    setFormError("");
    setMessage("");
    setSelectedId(block.id);
    setForm(toForm(block));
  }

  function onFieldChange(field, value) {
    setFormError("");
    setMessage("");
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function onPayloadPairChange(index, field, value) {
    setFormError("");
    setMessage("");
    setForm((prev) => {
      const nextPairs = [...prev.payloadPairs];
      nextPairs[index] = { ...nextPairs[index], [field]: value };
      return { ...prev, payloadPairs: nextPairs };
    });
  }

  function onStructuredArrayValueChange(pairIndex, itemIndex, fieldKey, value) {
    setFormError("");
    setMessage("");
    setForm((prev) => {
      const nextPairs = [...prev.payloadPairs];
      const parsed = tryParseJson(nextPairs[pairIndex]?.value);
      if (!Array.isArray(parsed)) return prev;
      const nextArray = parsed.map((item, idx) =>
        idx === itemIndex && item && typeof item === "object" ? { ...item, [fieldKey]: value } : item,
      );
      nextPairs[pairIndex] = {
        ...nextPairs[pairIndex],
        value: JSON.stringify(nextArray),
      };
      return { ...prev, payloadPairs: nextPairs };
    });
  }

  async function onSave(e) {
    e.preventDefault();
    if (!db || !form.id) return;
    const nextPayload = pairsToPayload(form.payloadPairs);
    if (form.imageUrl.trim()) nextPayload.imageUrl = form.imageUrl.trim();
    const nextBody = String(nextPayload.text ?? nextPayload.description ?? nextPayload.copy ?? "").trim();

    setSaving(true);
    setFormError("");
    setMessage("");
    try {
      await updateDoc(doc(db, COLLECTIONS.contentBlocks, form.id), {
        body: nextBody,
        pageKey: form.pageKey.trim(),
        blockType: form.blockType.trim(),
        isPublished: Boolean(form.isPublished),
        payload: nextPayload,
        updatedAt: serverTimestamp(),
      });
      setMessage("Saved changes. Website will reflect this content where this tag is used.");
    } catch (err) {
      setFormError(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function onUploadImage(e) {
    const file = e.target.files?.[0];
    if (!file || !storage || !form.id) return;
    setUploading(true);
    setFormError("");
    setMessage("");
    try {
      const path = `contentBlocks/${form.id}/${Date.now()}-${file.name}`;
      const fileRef = storageRef(storage, path);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setForm((prev) => ({ ...prev, imageUrl: url }));
      setMessage("Image uploaded. Click Save changes to publish it to this tag.");
    } catch (err) {
      setFormError(err.message || "Image upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <>
      <PageHeader
        title="Site content management"
        description="Select a tag, edit its text/image, and save. Your website pulls these tags directly."
      />

      {!configured ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 p-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-400">
          Configure Firebase before editing content.
        </div>
      ) : !user ? null : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {pageTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActivePage(tab)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  activePage === tab
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {tab === "all" ? "All sections" : tab}
              </button>
            ))}
          </div>

          {formError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
              {formError}
            </div>
          ) : null}
          {message ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
              {message}
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[1.3fr,1fr]">
            <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
                Section tags
              </div>
              {loading ? (
                <div className="p-4 text-sm text-zinc-600 dark:text-zinc-400">Loading content...</div>
              ) : error ? (
                <div className="p-4 text-sm text-red-700 dark:text-red-300">{error.message}</div>
              ) : filteredRows.length === 0 ? (
                <div className="p-4 text-sm text-zinc-600 dark:text-zinc-400">No content tags found.</div>
              ) : (
                <div className="max-h-[700px] space-y-3 overflow-auto p-3">
                  {filteredRows.map((row) => {
                    const image = getImageFromBlock(row);
                    const selected = selectedId === row.id;
                    return (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => chooseBlock(row)}
                        className={`w-full rounded-lg border p-3 text-left ${
                          selected
                            ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800/40"
                            : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                            {image ? (
                              <img src={image} alt={row.slotKey || row.id} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[10px] text-zinc-500">
                                No image
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                              {row.slotKey || row.id}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                              {row.slotKey || "(No tag)"}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">
                              {getEditableText(row) || "No text added yet."}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <form
              onSubmit={onSave}
              className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {form.slotKey ? `Editing: ${form.slotKey}` : "Select a tag"}
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Update content values only. Tags come from the website schema and are locked here.
              </p>

              {!form.id ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Select a tag from the list to edit.</p>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Content values</p>
                    {!form.payloadPairs.length ? (
                      <p className="rounded-md border border-dashed border-zinc-300 px-3 py-2 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                        No content values found for this tag yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {form.payloadPairs.map((pair, index) => (
                          <div key={`${pair.key}-${index}`} className="grid gap-1.5">
                            <label className="text-xs text-zinc-600 dark:text-zinc-400">
                              {keyToLabel(pair.key)}
                            </label>
                            {(() => {
                              const parsed = tryParseJson(pair.value);
                              const isArrayOfObjects =
                                Array.isArray(parsed) &&
                                parsed.every((item) => item && typeof item === "object" && !Array.isArray(item));

                              if (isArrayOfObjects) {
                                return (
                                  <div className="space-y-2 rounded-md border border-zinc-200 p-2 dark:border-zinc-700">
                                    {parsed.map((item, itemIndex) => (
                                      <div
                                        key={`${pair.key}-${itemIndex}`}
                                        className="rounded-md border border-zinc-200 p-2 dark:border-zinc-700"
                                      >
                                        <p className="mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                          Item {itemIndex + 1}
                                        </p>
                                        <div className="space-y-2">
                                          {Object.entries(item).map(([fieldKey, fieldValue]) => (
                                            <div key={fieldKey} className="grid gap-1">
                                              <label className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                                {keyToLabel(fieldKey)}
                                              </label>
                                              <input
                                                value={typeof fieldValue === "string" ? fieldValue : String(fieldValue)}
                                                onChange={(e) =>
                                                  onStructuredArrayValueChange(
                                                    index,
                                                    itemIndex,
                                                    fieldKey,
                                                    e.target.value,
                                                  )
                                                }
                                                className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }

                              return (
                                <input
                                  value={pair.value}
                                  onChange={(e) => onPayloadPairChange(index, "value", e.target.value)}
                                  placeholder={`Enter ${keyToLabel(pair.key).toLowerCase()}`}
                                  className="rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                                />
                              );
                            })()}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Image for this tag</p>
                    <div className="h-40 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                      {form.imageUrl ? (
                        <img src={form.imageUrl} alt={form.slotKey} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                          No image exists for this tag
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onUploadImage}
                      disabled={uploading}
                      className="block w-full text-xs text-zinc-600 dark:text-zinc-400"
                    />
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Upload stores file in Firebase Storage and links it to this tag.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
