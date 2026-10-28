import Link from "next/link";
export default function NotFound() { return <div className="empty"><h2>Record not found.</h2><p className="muted">It may have been removed, or the address is incomplete.</p><Link className="button secondary" href="/studio">Back to overview</Link></div>; }
