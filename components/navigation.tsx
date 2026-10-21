"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, MessageSquareText, ThumbsUp, ArrowUpRight, UtensilsCrossed, LogOut } from "lucide-react";
const items = [{ href: "/admin", label: "Overview", icon: LayoutDashboard }, { href: "/admin/media", label: "AI content", icon: MessageSquareText }, { href: "/admin/users", label: "People", icon: Users }, { href: "/admin/ratings", label: "Ratings", icon: ThumbsUp }];
export default function Navigation({ name }: { name: string }) {
  const path = usePathname();
  return <aside className="sidebar"><Link href="/admin" className="brand"><UtensilsCrossed size={22}/><span>NYC FOOD SPOTS<small>THE ADMIN SPACE</small></span></Link><p className="nav-label">WORKSPACE</p>
    <nav aria-label="Admin navigation">{items.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={path === href ? "active" : ""} aria-current={path === href ? "page" : undefined}><Icon size={18}/>{label}{path === href && <span className="nav-dot"/>}</Link>)}</nav>
    <div className="sidebar-bottom"><a href="https://hello-world-an-qi2.vercel.app" target="_blank" rel="noreferrer">Visit the app <ArrowUpRight size={16}/></a><div className="account"><div className="avatar">{name[0]?.toUpperCase() || "A"}</div><div><strong>{name}</strong><small>Super administrator</small></div><form action="/auth/signout" method="post"><button aria-label="Sign out" title="Sign out"><LogOut size={17}/></button></form></div></div>
  </aside>;
}
