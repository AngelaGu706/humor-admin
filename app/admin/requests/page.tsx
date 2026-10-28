import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { foodRequests } from '@/lib/food-traces';
import { pageNumber } from '@/lib/data';
import { PageHeading, ReadOnly } from '@/components/ui';
import FoodRequestList from '@/components/food-request-list';
export default async function Requests({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const search = await searchParams; const page = pageNumber(search.page); const q = (search.q ?? '').slice(0, 120);
  const { rows, count } = await foodRequests(page, q); const total = Math.max(1, Math.ceil(count / 20));
  return <><PageHeading title="Generation requests" description="Follow each food recommendation from input to result."><ReadOnly/></PageHeading>
    <form className="course-search" action="/admin/requests"><label className="sr-only" htmlFor="request-search">Search food requests</label><input id="request-search" name="q" defaultValue={q} maxLength={120} placeholder="Search input or restaurant…"/><button className="button secondary">Search</button>{q && <Link className="text-link" href="/admin/requests">Clear</Link>}</form>
    <section className="panel table-panel"><div className="panel-heading"><h2>Food requests <span className="count">{count.toLocaleString()}</span></h2><span className="pill">Newest first</span></div><FoodRequestList rows={rows}/>
    <div className="pagination"><span>{count ? `${(page - 1) * 20 + 1}–${Math.min(page * 20, count)} of ${count} records` : 'No records'}</span><div>{page > 1 && <Link aria-label="Previous page" href={`/admin/requests?page=${page - 1}&q=${encodeURIComponent(q)}`}><ChevronLeft size={16}/></Link>}<span>Page {page} of {total}</span>{page < total && <Link aria-label="Next page" href={`/admin/requests?page=${page + 1}&q=${encodeURIComponent(q)}`}><ChevronRight size={16}/></Link>}</div></div></section></>;
}
