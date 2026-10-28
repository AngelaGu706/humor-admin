"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, FileText } from "lucide-react";
import type { Generation } from "@/lib/data";
import { decodeContent, encodeContent, cuisines } from "@/lib/content";
import { Empty, Pagination } from "@/components/ui";

type Form = { title: string; prompt: string; content: string; structured: boolean; area: string; food: string; cuisine: string; recommendation: string };
const blank: Form = { title: "", prompt: "", content: "", structured: true, area: "", food: "", cuisine: "", recommendation: "" };
export default function MediaManager({ rows, count, page }: { rows: Generation[]; count: number; page: number }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<Generation | null>(null);
  const [deleting, setDeleting] = useState<Generation | null>(null);
  const [form, setForm] = useState<Form>(blank);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const field = (key: keyof Form, value: string) => setForm(old => ({ ...old, [key]: value }));
  function open(row: Generation | null) {
    setEditing(row); setError(""); setStatus("");
    const decoded = row ? decodeContent(row.content) : null;
    setForm(row ? { ...blank, title: row.title, prompt: row.prompt, content: row.content, structured: Boolean(decoded), ...(decoded ?? {}) } : { ...blank });
    dialog.current?.showModal();
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError("");
    try {
      const content = form.structured ? encodeContent({ area: form.area.trim(), food: form.food.trim(), cuisine: form.cuisine, recommendation: form.recommendation.trim() }) : form.content;
      const response = await fetch(editing ? `/api/media/${editing.id}` : "/api/media", {
        method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, prompt: form.prompt, content }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save this pick.");
      dialog.current?.close(); setStatus(editing ? "Changes saved." : "Food pick created."); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save. Please try again."); }
    finally { setBusy(false); busyRef.current = false; }
  }
  async function remove() {
    if (!deleting || confirmTitle !== deleting.title || busyRef.current) return;
    busyRef.current = true; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/media/${deleting.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not delete this pick.");
      deleteDialog.current?.close(); setStatus("Food pick deleted.");
      if (rows.length === 1 && page > 1) router.push(`/admin/media?page=${page - 1}`);
      router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Could not delete. Please try again."); }
    finally { setBusy(false); busyRef.current = false; }
  }
  const preventBusyClose = (event: React.SyntheticEvent) => { if (busy) event.preventDefault(); };
  return <><div className="content-toolbar"><span/><button className="button primary" onClick={() => open(null)}><Plus size={17}/>Add pick</button></div><div role="status" aria-live="polite">{status && <p className="notice success">{status}</p>}</div>
    <section className="panel table-panel"><div className="panel-heading"><h2>Food picks <span className="count">{count.toLocaleString()}</span></h2><span className="pill">Newest first</span></div>
      {rows.length ? <div className="table-scroll"><table><thead><tr><th>Food pick</th><th>Content</th><th>Created (UTC)</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{rows.map(row => { const decoded = decodeContent(row.content); return <tr key={row.id}><td className="media-title"><div className="media-label"><span className="mini-icon"><FileText size={17}/></span><div><strong>{row.title}</strong><small className="subtext">{decoded?.area || "Food recommendation"}</small>{row.trace_id ? <Link className="text-link" href={`/admin/requests/${row.trace_id}`}>View trace ↗</Link> : <small className="subtext">No recorded trace</small>}</div></div></td><td className="content-preview"><p>{decoded?.recommendation || row.content}</p><small className="subtext">{decoded?.food || row.prompt}</small></td><td className="nowrap">{new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</td><td><div className="row-actions"><button className="icon-button" title={`Edit ${row.title}`} aria-label={`Edit ${row.title}`} onClick={() => open(row)}><Pencil size={16}/></button><button className="icon-button danger" title={`Delete ${row.title}`} aria-label={`Delete ${row.title}`} onClick={() => { setDeleting(row); setConfirmTitle(""); setError(""); setStatus(""); deleteDialog.current?.showModal(); }}><Trash2 size={16}/></button></div></td></tr>; })}</tbody></table></div> : <Empty title="No food picks yet">Add a pick to get started.</Empty>}
      <Pagination page={page} count={count} base="/admin/media"/></section>
    <dialog ref={dialog} className="modal" onCancel={preventBusyClose}><form onSubmit={save}><header><div><h2>{editing ? "Edit pick" : "Add pick"}</h2></div><button type="button" className="icon-button" aria-label="Close editor" disabled={busy} onClick={() => dialog.current?.close()}><X size={19}/></button></header>
      <fieldset disabled={busy}><label>Restaurant / title<input autoFocus required maxLength={90} value={form.title} onChange={e => field("title", e.target.value)}/></label><label>Original prompt<textarea required maxLength={1000} rows={2} value={form.prompt} onChange={e => field("prompt", e.target.value)}/></label>
        {form.structured ? <><div className="form-grid"><label>Neighborhood<input required maxLength={70} value={form.area} onChange={e => field("area", e.target.value)}/></label><label>Cuisine<select value={form.cuisine} onChange={e => field("cuisine", e.target.value)}><option value="">Unspecified</option>{[...new Set([...cuisines, ...(form.cuisine ? [form.cuisine] : [])])].map(c => <option key={c}>{c}</option>)}</select></label></div><label>Recommended dish<input required maxLength={50} value={form.food} onChange={e => field("food", e.target.value)}/></label><label>Recommendation<textarea required rows={3} maxLength={1200} value={form.recommendation} onChange={e => field("recommendation", e.target.value)}/></label></> : <label>Content (original format)<textarea required rows={7} maxLength={10000} value={form.content} onChange={e => field("content", e.target.value)}/></label>}
      </fieldset>{error && <p className="notice error" role="alert">{error}</p>}<footer><button type="button" className="button secondary" disabled={busy} onClick={() => dialog.current?.close()}>Cancel</button><button type="submit" className="button primary" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Add pick"}</button></footer></form></dialog>
    <dialog ref={deleteDialog} className="modal delete-modal" onCancel={preventBusyClose}><header><h2>Delete this food pick?</h2><button className="icon-button" aria-label="Cancel deletion" disabled={busy} onClick={() => deleteDialog.current?.close()}><X size={19}/></button></header><p>This permanently deletes <strong>{deleting?.title}</strong> and may remove its ratings and saved picks. This cannot be undone.</p><label>Type the full title to confirm<input value={confirmTitle} disabled={busy} onChange={e => setConfirmTitle(e.target.value)}/></label>{error && <p className="notice error" role="alert">{error}</p>}<footer><button className="button secondary" disabled={busy} onClick={() => deleteDialog.current?.close()}>Cancel</button><button className="button destructive" disabled={busy || !deleting || confirmTitle !== deleting.title} onClick={remove}>{busy ? "Deleting…" : "Delete permanently"}</button></footer></dialog>
  </>;
}
