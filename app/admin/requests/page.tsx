import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { foodRequests, foodRequestsUrl, requestFilter, type FoodRequestFilter } from '@/lib/food-traces';
import { pageNumber } from '@/lib/data';
import { PageHeading, ReadOnly } from '@/components/ui';
import FoodRequestList from '@/components/food-request-list';
const filters: { value: FoodRequestFilter; label: string }[] = [
  { value: 'all', label: 'All' }, { value: 'completed', label: 'Completed' }, { value: 'failed', label: 'Failed' },
];
export default async function Requests({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; status?: string }> }) {
  const search = await searchParams;
  const page = pageNumber(search.page); const q = (search.q ?? '').trim().slice(0, 120); const status = requestFilter(search.status);
  const { rows, count } = await foodRequests(page, q, status); const total = Math.max(1, Math.ceil(count / 20));
  return <><PageHeading title="Generation requests"><ReadOnly/></PageHeading>
    <div className="food-request-tools">
      <form className="course-search" action="/admin/requests">
        <label className="sr-only" htmlFor="request-search">Search food requests</label>
        <input id="request-search" name="q" defaultValue={q} maxLength={120} placeholder="Search input or restaurant…"/>
        {status !== 'all' && <input type="hidden" name="status" value={status}/>}
        <button className="button secondary">Search</button>
        {q && <Link className="text-link" href={foodRequestsUrl({ status })}>Clear</Link>}
      </form>
      <nav className="food-status-filters" aria-label="Filter request status">{filters.map(filter => <Link key={filter.value} href={foodRequestsUrl({ q, status: filter.value })} aria-current={status === filter.value ? 'page' : undefined}>{filter.label}</Link>)}</nav>
    </div>
    <section className="panel table-panel"><div className="panel-heading"><h2>Food requests <span className="count">{count.toLocaleString()}</span></h2><span className="pill">Newest first</span></div><FoodRequestList rows={rows} filtered={Boolean(q) || status !== 'all'}/>
    <div className="pagination"><span>{count ? `${(page - 1) * 20 + 1}–${Math.min(page * 20, count)} of ${count} records` : 'No records'}</span><div>{page > 1 && <Link aria-label="Previous page" href={foodRequestsUrl({ page: page - 1, q, status })}><ChevronLeft size={16}/></Link>}<span>Page {page} of {total}</span>{page < total && <Link aria-label="Next page" href={foodRequestsUrl({ page: page + 1, q, status })}><ChevronRight size={16}/></Link>}</div></div></section></>;
}
