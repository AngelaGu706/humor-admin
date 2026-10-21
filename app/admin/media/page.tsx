import { generations, pageNumber } from "@/lib/data";
import { PageHeading } from "@/components/ui";
import MediaManager from "./manager";
export default async function Media({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = pageNumber((await searchParams).page);
  const { rows, count } = await generations(page);
  return <><PageHeading title="AI content" description="Add and manage food recommendations."/><MediaManager rows={rows} count={count} page={page}/></>;
}
