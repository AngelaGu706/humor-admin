"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Network, ListOrdered, SlidersHorizontal, MessageSquareText, Inbox, Braces, BookOpen, FileText, Cpu, Building2, Users, Globe, Mail, Image, LogOut, UtensilsCrossed } from "lucide-react";
const groups = [
  { title: "EXPLORE", items: [{ key: "", label: "Overview", icon: LayoutDashboard }, { key: "requests", label: "Generation requests", icon: Inbox }, { key: "chains", label: "Prompt chains", icon: Network }, { key: "templates", label: "Chain templates", icon: FileText }, { key: "steps", label: "Prompt steps", icon: ListOrdered }, { key: "responses", label: "Model responses", icon: Braces }, { key: "content", label: "AI content", icon: MessageSquareText }, { key: "images", label: "Images", icon: Image }] },
  { title: "CONFIGURE", items: [{ key: "mix", label: "Chain mix", icon: SlidersHorizontal }, { key: "terms", label: "Terms", icon: BookOpen }, { key: "examples", label: "Generation examples", icon: FileText }, { key: "models", label: "Models", icon: Cpu }, { key: "providers", label: "Providers", icon: Building2 }, { key: "users", label: "Users", icon: Users }, { key: "domains", label: "Signup domains", icon: Globe }, { key: "emails", label: "Email whitelist", icon: Mail }] },
];
export default function CourseNavigation({ name }: { name: string }) {
  const path = usePathname();
  return <aside className="sidebar course-sidebar"><Link href="/studio" className="brand"><Network size={22}/><span>AI WORKSPACE<small>COURSE ADMIN</small></span></Link><div className="course-nav-scroll">
    {groups.map(group => <section key={group.title}><p className="nav-label">{group.title}</p><nav aria-label={group.title}>{group.items.map(({ key, label, icon: Icon }) => {
      const href = `/studio${key ? `/${key}` : ""}`, active = key ? path.startsWith(`${href}/`) || path === href : path === href;
      return <Link href={href} key={href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}><Icon size={17}/>{label}</Link>;
    })}</nav></section>)}
  </div><div className="sidebar-bottom"><Link href="/admin"><UtensilsCrossed size={15}/> Food workspace</Link><div className="account"><div className="avatar">{name[0]?.toUpperCase() || "A"}</div><div><strong>{name}</strong><small>Course administrator</small></div><form action="/auth/course/signout" method="post"><button aria-label="Sign out" title="Sign out"><LogOut size={17}/></button></form></div></div></aside>;
}
