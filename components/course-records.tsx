import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { fieldLabel, recordTitle, safeImageUrl, type Resource } from "@/lib/course-catalog";
import type { Lookups, Row, Search } from "@/lib/course-data";
import { CourseActions } from "./course-manager";
export function CourseValue({ value, column, resource, lookups }: { value: Row[string]; column: string; resource: Resource; lookups?: Lookups }) {
  if (value === null || value === undefined || value === "") return <span className="muted">—</span>;
  const target = resource.references?.[column];
  const lookup = lookups?.[column]?.find(option => option.value === String(value));
  if (target) return <Link className="record-reference" href={`/studio/${target}/${value}`}>{lookup?.label || `#${value}`}<ArrowUpRight size={11}/></Link>;
  if (typeof value === "boolean") return <span className={`pill${value ? " olive" : ""}`}>{value ? "Yes" : "No"}</span>;
  if (column.endsWith("_utc")) return <span className="nowrap">{new Date(String(value)).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}</span>;
  if (column === "url") { const url = safeImageUrl(value); return url ? <a href={url} target="_blank" rel="noreferrer" className="text-link">Open image <ArrowUpRight size={12}/></a> : <span className="muted">Image unavailable</span>; }
  return <span className="course-cell-text">{String(value)}</span>;
}
export function CourseTable({ resourceKey, resource, rows, lookups }: { resourceKey: string; resource: Resource; rows: Row[]; lookups?: Lookups }) {
  const columns = resource.preview.filter(column => !["name", "term", "slug", "apex_domain", "email_address", "caption", "content", "first_name", "last_name"].includes(column));
  return <div className="table-scroll"><table className="course-table"><thead><tr><th>Record</th>{columns.map(column => <th key={column}>{fieldLabel(column)}</th>)}{resource.fields && <th><span className="sr-only">Actions</span></th>}</tr></thead><tbody>{rows.map(row => <tr key={row.id as string}><td><Link className="record-title" href={`/studio/${resourceKey}/${row.id}`} title={recordTitle(resource, row)}>{recordTitle(resource, row)}</Link><span className="subtext">{resource.idType === "uuid" ? String(row.id).slice(0, 8) : `#${row.id}`}</span></td>{columns.map(column => <td key={column}><CourseValue value={row[column]} column={column} resource={resource} lookups={lookups}/></td>)}{resource.fields && <td><CourseActions row={row}/></td>}</tr>)}</tbody></table></div>;
}
export function CoursePagination({ resourceKey, page, count, search }: { resourceKey: string; page: number; count: number; search: Search }) {
  const total = Math.max(1, Math.ceil(count / 20));
  function href(next: number) { const params = new URLSearchParams(); for (const [key, value] of Object.entries(search)) if (value && key !== "page") params.set(key, value); params.set("page", String(next)); return `/studio/${resourceKey}?${params}`; }
  return <div className="pagination"><span>{count ? `${Math.min((page - 1) * 20 + 1, count)}–${Math.min(page * 20, count)} of ${count.toLocaleString()} records` : "No records"}</span><div>{page > 1 && <Link href={href(page - 1)} aria-label="Previous page"><ChevronLeft size={16}/></Link>}<span>Page {page} of {total}</span>{page < total && <Link href={href(page + 1)} aria-label="Next page"><ChevronRight size={16}/></Link>}</div></div>;
}
export function ImagePreview({ url, description }: { url: unknown; description?: string | null }) {
  const safe = safeImageUrl(url);
  return safe ? <a href={safe} target="_blank" rel="noreferrer" className="course-image"><Image src={safe} alt={description || "Generation input image"} width={640} height={420} unoptimized referrerPolicy="no-referrer"/></a> : <p className="muted">Image unavailable</p>;
}
