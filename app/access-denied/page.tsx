import Link from "next/link";
import { ShieldAlert } from "lucide-react";
export default async function AccessDenied({ searchParams }: { searchParams: Promise<{ setup?: string }> }) {
  const { setup } = await searchParams;
  return <main className="auth-page"><section className="auth-card"><div className="icon-tile"><ShieldAlert/></div><p className="eyebrow">ADMINISTRATOR ACCESS</p><h1>{setup ? "One more setup step." : "This door is for admins."}</h1>
    <p className="muted">{setup ? "The database administrator needs to finish configuring access before this dashboard can load." : "You are signed in, but this account does not have administrator access. Ask the project owner to check your profile permissions."}</p>
    <form action="/auth/signout" method="post"><button className="button primary">Sign out and switch account</button></form><Link className="text-link" href="/admin">Check access again →</Link>
    </section></main>;
}
