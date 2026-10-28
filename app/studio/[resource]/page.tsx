import Link from "next/link";
import { courseList, courseOptions, type Search } from "@/lib/course-data";
import { PageHeading, ReadOnly } from "@/components/ui";
import CourseManager from "@/components/course-manager";
import { CourseTable, CoursePagination, ImagePreview } from "@/components/course-records";
export default async function ResourcePage({ params, searchParams }: { params: Promise<{ resource: string }>; searchParams: Promise<Search> }) {
  const { resource: key } = await params, search = await searchParams;
  const { resource, rows, count, page, lookups } = await courseList(key, search), options = resource.fields ? await courseOptions(resource) : {};
  const filters = Object.entries(resource.filters ?? {}).filter(([filter]) => search[filter]);
  return <><PageHeading title={resource.title} description={resource.description}>{!resource.fields && <ReadOnly/>}</PageHeading>
    <form method="get" className="course-search"><label className="sr-only" htmlFor="course-search">Search {resource.title.toLowerCase()}</label><input id="course-search" name="q" defaultValue={search.q ?? ""} maxLength={120} placeholder={resource.search.length ? `Search ${resource.title.toLowerCase()}…` : "Search by record ID…"}/>{filters.map(([filter]) => <input key={filter} type="hidden" name={filter} value={search[filter]}/>)}<button className="button secondary">Search</button>{(search.q || filters.length > 0) && <Link className="text-link" href={`/studio/${key}`}>Clear filters</Link>}</form>
    {filters.length > 0 && <p className="course-filter-note">Filtered by {filters.map(([filter]) => `${filter}: ${search[filter]}`).join(" · ")}</p>}
    <CourseManager resourceKey={key} resource={resource} rows={rows} options={options}>
      <section className="panel"><div className="panel-heading"><h2>{resource.title}<span className="count">{count.toLocaleString()}</span></h2>{resource.updateOnly && <span className="pill">Editable</span>}</div>
        {!rows.length ? <div className="empty"><h3>{search.q || filters.length ? "No matching records." : "No records yet."}</h3><p className="muted">{search.q || filters.length ? "Try another search or clear the filters." : "Records will appear here when they are added to the database."}</p></div> : key === "images" ? <div className="course-gallery">{rows.map(row => <article key={String(row.id)}><ImagePreview url={row.url} description={String(row.image_description || "")}/><Link href={`/studio/images/${row.id}`} className="record-title">{String(row.image_description || `Image ${String(row.id).slice(0, 8)}`).slice(0, 140)}</Link></article>)}</div> : <CourseTable resourceKey={key} resource={resource} rows={rows} lookups={lookups}/>}
        <CoursePagination resourceKey={key} page={page} count={count} search={search}/>
      </section>
    </CourseManager>
  </>;
}
