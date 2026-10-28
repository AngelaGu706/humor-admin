import Link from "next/link";
import { notFound } from "next/navigation";
import { isUuid } from "@/lib/content";
import { generations, pageNumber } from "@/lib/data";
import { PageHeading } from "@/components/ui";
import MediaManager from "./manager";
export default async function Media({ searchParams }: { searchParams: Promise<{ page?: string; generation?: string }> }) {
  const search = await searchParams;
  if (search.generation && !isUuid(search.generation)) notFound();
  const page = search.generation ? 1 : pageNumber(search.page);
  const { rows, count } = await generations(page, search.generation);
  return <><PageHeading title="AI content"/>{search.generation && <p className="course-filter-note">Showing the pick linked to this request. <Link className="text-link" href="/admin/media">View all picks</Link></p>}<MediaManager rows={rows} count={count} page={page}/></>;
}
