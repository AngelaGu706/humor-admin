import { UtensilsCrossed, ShieldCheck } from "lucide-react";
import LoginButton from "./sign-in";
import Link from "next/link";
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  return <main className="auth-page"><div className="auth-brand"><UtensilsCrossed size={24} /> NYC FOOD SPOTS <span>ADMIN</span></div>
    <section className="auth-card"><div className="icon-tile"><ShieldCheck size={26}/></div>
      <h1>Admin sign-in</h1><p className="muted">Manage food picks.</p>
      {configured ? <LoginButton failed={Boolean(error)}/> : <p className="notice">Connect the Supabase environment variables to enable sign-in.</p>}
      <p className="auth-note">Administrator access required.</p>
      <Link href="/course-login" className="text-link">Open course workspace →</Link>
    </section></main>;
}
