import Link from "next/link";
import { ShieldAlert } from "lucide-react";
export default async function AccessDenied({ searchParams }: { searchParams: Promise<{ setup?: string }> }) {
  const { setup } = await searchParams;
  return <main className="auth-page"><section className="auth-card"><div className="icon-tile"><ShieldAlert/></div><h1>{setup ? "Setup required" : "Access denied"}</h1>
    <p className="muted">{setup ? "Ask the project owner to finish setting up admin access." : "This Google account does not have admin access."}</p>
    <form action="/auth/signout" method="post"><button className="button primary">Switch account</button></form><Link className="text-link" href="/admin">Try again →</Link>
    </section></main>;
}
