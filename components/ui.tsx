import Link from "next/link";
import { ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
const PAGE_SIZE = 20;
export function PageHeading({ eyebrow = "YOUR WORKSPACE", title, description, children }: { eyebrow?: string; title: string; description: string; children?: React.ReactNode }) {
  return <header className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="muted">{description}</p></div>{children}</header>;
}
export function Pagination({ page, count, base }: { page: number; count: number; base: string }) {
  const total = Math.max(1, Math.ceil(count / PAGE_SIZE));
  return <div className="pagination"><span>{count === 0 ? "No records" : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, count)} of ${count.toLocaleString()} records`}</span><div>{page > 1 && <Link href={`${base}?page=${page - 1}`} aria-label="Previous page"><ChevronLeft size={16}/></Link>}<span>Page {page} of {total}</span>{page < total && <Link href={`${base}?page=${page + 1}`} aria-label="Next page"><ChevronRight size={16}/></Link>}</div></div>;
}
export function Empty({ title, children }: { title: string; children: React.ReactNode }) { return <div className="empty"><h3>{title}</h3><p className="muted">{children}</p></div>; }
export function ReadOnly() { return <span className="pill"><ShieldCheck size={14}/> Read only</span>; }
