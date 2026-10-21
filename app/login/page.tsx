import { UtensilsCrossed, ShieldCheck } from "lucide-react";
import LoginButton from "./sign-in";
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  return <main className="auth-page"><div className="auth-brand"><UtensilsCrossed size={24} /> NYC FOOD SPOTS <span>ADMIN</span></div>
    <section className="auth-card"><div className="icon-tile"><ShieldCheck size={26}/></div><p className="eyebrow">A LITTLE BEHIND THE SCENES</p>
      <h1>A good place to<br/>keep things in order.</h1><p className="muted">Sign in to look after the food picks, people, and opinions that make up our community.</p>
      {configured ? <LoginButton failed={Boolean(error)}/> : <p className="notice">Connect the Supabase environment variables to enable sign-in.</p>}
      <p className="auth-note">Google sign-in · Administrator access required</p>
    </section><p className="auth-footer">NYC Food Spots / The community, at a glance.</p></main>;
}
