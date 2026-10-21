import Navigation from "@/components/navigation";
import { requireAdmin } from "@/lib/auth";
export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, user } = await requireAdmin();
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || user.email || "Administrator";
  return <div className="admin-shell"><Navigation name={name}/><div className="main-area"><div className="topbar"><span>Admin</span><span className="access-badge"><span/> Administrator</span></div><main className="workspace">{children}</main><footer className="workspace-footer">NYC Food Spots <span>Admin</span></footer></div></div>;
}
