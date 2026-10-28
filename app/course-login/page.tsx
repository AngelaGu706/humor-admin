import Link from "next/link";
import { Network, ShieldCheck, ArrowLeft } from "lucide-react";
import { courseConfigured } from "@/lib/course-server";
export const dynamic = "force-dynamic";
export default async function CourseLogin({ searchParams }: { searchParams: Promise<{ error?: string; denied?: string; setup?: string }> }) {
  const { error, denied, setup } = await searchParams;
  return <main className="auth-page"><div className="auth-brand"><Network size={24}/> AI WORKSPACE <span>ADMIN</span></div><section className="auth-card"><div className="icon-tile"><ShieldCheck size={26}/></div><h1>Course sign-in</h1><p className="muted">Manage course AI data</p>
    {error && <p className="notice error" role="alert">Sign-in could not be completed. Please try again.</p>}
    {denied && <p className="notice error" role="alert">This Google account is signed in, but does not have administrator access to the course database.</p>}
    {setup && <p className="notice error" role="alert">The course database connection needs to be checked.</p>}
    {courseConfigured() ? <a className="google-button" href="/auth/course/start"><span className="google-g">G</span>Continue with Google</a> : <p className="notice">The course database connection has not been configured.</p>}
    <p className="auth-note">Admins only</p><Link href="/login" className="text-link"><ArrowLeft size={14}/> Food workspace</Link>
  </section></main>;
}
