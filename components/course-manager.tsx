"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { recordTitle, type Resource } from "@/lib/course-catalog";
import type { Lookups, Row } from "@/lib/course-data";

const Actions = createContext<{ resource: Resource; open: (mode: "create" | "edit" | "delete", row?: Row) => void } | null>(null);
export function CourseActions({ row }: { row: Row }) {
  const context = useContext(Actions); if (!context) return null;
  const { resource, open } = context;
  return <div className="row-actions"><button className="icon-button" aria-label={`Edit ${resource.singular.toLowerCase()} ${row.id}`} onClick={() => open("edit", row)}><Pencil size={16}/></button>{!resource.updateOnly && <button className="icon-button danger" aria-label={`Delete ${resource.singular.toLowerCase()} ${row.id}`} onClick={() => open("delete", row)}><Trash2 size={16}/></button>}</div>;
}
export default function CourseManager({ resourceKey, resource, rows, options, children, detail = false }: { resourceKey: string; resource: Resource; rows: Row[]; options: Lookups; children?: React.ReactNode; detail?: boolean }) {
  const router = useRouter(), dialog = useRef<HTMLDialogElement>(null), busyRef = useRef(false);
  const [selected, setSelected] = useState<{ mode: "create" | "edit" | "delete"; row?: Row } | null>(null);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  useEffect(() => { if (selected && !dialog.current?.open) dialog.current?.showModal(); else if (!selected) dialog.current?.close(); }, [selected]);
  function open(mode: "create" | "edit" | "delete", row?: Row) {
    setError(""); setMessage("");
    setValues(Object.fromEntries((resource.fields ?? []).map(field => [field.key, field.type === "boolean" ? row?.[field.key] === true : String(row?.[field.key] ?? (field.key === "priority" ? 0 : ""))])));
    setSelected({ mode, row });
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected || busyRef.current) return;
    busyRef.current = true; setBusy(true); setError("");
    const action = selected;
    try {
      const response = await fetch(`/api/studio/${resourceKey}${action.row ? `/${action.row.id}` : ""}`, {
        method: action.mode === "delete" ? "DELETE" : action.mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(action.mode !== "delete" ? { values } : {}), ...(action.row ? { version: action.row.modified_datetime_utc } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save this change.");
      setSelected(null); setMessage(action.mode === "delete" ? "Record deleted." : "Changes saved."); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save this change."); }
    finally { busyRef.current = false; setBusy(false); }
  }
  if (!resource.fields) return children;
  return <Actions.Provider value={{ resource, open }}>
    <div className="course-action-bar">{!detail && !resource.updateOnly && <button className="button primary" onClick={() => open("create")}><Plus size={15}/>Add {resource.singular.toLowerCase()}</button>}{detail && rows[0] && <CourseActions row={rows[0]}/>}<span className="muted">{detail ? "Changes apply to this record." : resource.updateOnly ? "Edit an entry to update the mix." : "Open a record to view all fields."}</span></div>
    {message && <p className="notice success" role="status">{message}</p>}
    {children}
    <dialog ref={dialog} className="modal course-modal" aria-labelledby="course-modal-title" onCancel={event => { event.preventDefault(); if (!busyRef.current) setSelected(null); }}>
      <header><h2 id="course-modal-title">{selected?.mode === "delete" ? "Delete" : selected?.mode === "edit" ? "Edit" : "Add"} {resource.singular.toLowerCase()}</h2><button type="button" className="icon-button" aria-label="Close" disabled={busy} onClick={() => setSelected(null)}><X size={18}/></button></header>
      <form onSubmit={save}>
        {selected?.mode === "delete" ? <p className="muted">Delete “{selected.row && recordTitle(resource, selected.row).slice(0, 120)}”? This permanently removes the record.</p> : <fieldset disabled={busy}>{resource.fields.map(field => <label key={field.key} className={field.type === "boolean" ? "check-field" : ""}>{field.type === "boolean" ? <><input type="checkbox" checked={values[field.key] === true} onChange={event => setValues({ ...values, [field.key]: event.target.checked })}/>{field.label}</> : <>{field.label}{!field.required && !field.label.includes("optional") && <span className="muted"> (optional)</span>}{options[field.key] ? <select required={field.required} value={String(values[field.key] ?? "")} onChange={event => setValues({ ...values, [field.key]: event.target.value })}><option value="">Choose…</option>{options[field.key].map(option => <option key={option.value} value={option.value}>{option.label} · #{option.value}</option>)}</select> : field.type === "long" ? <textarea required={field.required} maxLength={field.max ?? 20000} rows={4} value={String(values[field.key] ?? "")} onChange={event => setValues({ ...values, [field.key]: event.target.value })}/> : <input type={field.type === "integer" ? "number" : field.type === "email" ? "email" : "text"} required={field.required} maxLength={field.max ?? 20000} min={field.min} max={field.type === "integer" ? field.max : undefined} step={field.type === "integer" ? 1 : undefined} placeholder={field.type === "domain" ? "columbia.edu" : field.type === "uuid" ? "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" : undefined} value={String(values[field.key] ?? "")} onChange={event => setValues({ ...values, [field.key]: event.target.value })}/>}</>}</label>)}</fieldset>}
        {["domains", "emails"].includes(resourceKey) && <p className="notice">This changes who can register for the course app.</p>}
        {error && <p className="notice error" role="alert">{error}</p>}
        <footer><button className="button secondary" type="button" disabled={busy} onClick={() => setSelected(null)}>Cancel</button><button className={`button ${selected?.mode === "delete" ? "destructive" : "primary"}`} type="submit" disabled={busy}>{busy ? "Saving…" : selected?.mode === "delete" ? "Delete record" : "Save changes"}</button></footer>
      </form>
    </dialog>
  </Actions.Provider>;
}
