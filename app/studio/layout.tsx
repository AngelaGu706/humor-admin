import CourseNavigation from "@/components/course-navigation";
import { requireCourseAdmin } from "@/lib/course-server";
export const dynamic = "force-dynamic";
export default async function CourseLayout({ children }: { children: React.ReactNode }) {
  const { profile, user } = await requireCourseAdmin();
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || user.email || "Administrator";
  return <div className="admin-shell"><CourseNavigation name={name}/><div className="main-area"><header className="topbar"><span>Course database</span><span className="access-badge"><span/> Administrator</span></header><main className="workspace">{children}</main><footer className="workspace-footer">AI Workspace <span>Course admin</span></footer></div></div>;
}
