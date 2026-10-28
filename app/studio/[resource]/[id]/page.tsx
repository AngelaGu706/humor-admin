import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { courseRecord, relatedRecords, courseOptions, type Row } from "@/lib/course-data";
import { fieldLabel, recordTitle, resources } from "@/lib/course-catalog";
import { PageHeading, ReadOnly } from "@/components/ui";
import CourseManager from "@/components/course-manager";
import { CourseValue, ImagePreview } from "@/components/course-records";
import { requireCourseAdmin } from "@/lib/course-server";
export default async function RecordPage({ params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource: key, id } = await params;
  const { resource, row } = await courseRecord(key, id);
  const [related, options] = await Promise.all([relatedRecords(key, id), resource.fields ? courseOptions(resource) : Promise.resolve({})]);
  let image: Row | null = key === "images" ? row : null;
  if (row.image_id) {
    const { supabase } = await requireCourseAdmin();
    const result = await supabase.from("images").select("id,url,image_description").eq("id", row.image_id).maybeSingle();
    if (result.error) throw new Error("Could not load the input image."); image = result.data;
  }
  const title = recordTitle(resource, row);
  return <><Link href={`/studio/${key}`} className="text-link course-back"><ArrowLeft size={13}/> {resource.title}</Link><PageHeading title={title.length > 90 ? `${resource.singular} #${id}` : title} description={`${resource.singular} · ${id}`}>{!resource.fields && <ReadOnly/>}</PageHeading>
    <CourseManager resourceKey={key} resource={resource} rows={[row]} options={options} detail>
      {image && <section className="panel course-input-image"><div className="panel-heading"><h2>{key === "images" ? "Image" : "Input image"}</h2></div><ImagePreview url={image.url} description={String(image.image_description || "")}/></section>}
      <section className="panel course-details"><div className="panel-heading"><h2>Details</h2></div><dl>{resource.columns.filter(column => !(key === "images" && column === "url")).map(column => <div key={column} className={column.includes("prompt") && !column.endsWith("_id") || ["llm_model_response", "content", "definition", "example", "explanation", "image_description"].includes(column) ? "long-detail" : ""}><dt>{fieldLabel(column)}</dt><dd><CourseValue value={row[column]} column={column} resource={resource}/></dd></div>)}</dl></section>
    </CourseManager>
    {related.map(group => <section className="panel course-related" key={group.key}><div className="panel-heading"><h2>{group.title}<span className="count">{group.count.toLocaleString()}</span></h2><Link className="text-link" href={group.href}>View all <ArrowUpRight size={13}/></Link></div>{group.rows.length ? <div className="course-linked-list">{group.rows.map(linked => <article key={String(linked.id)}><div className="course-linked-header"><Link className="record-reference" href={`/studio/${group.key}/${linked.id}`}>{recordTitle(resources[group.key], linked).slice(0, 160)}</Link>{group.key === "responses" && <span className="pill">{linked.processing_time_seconds === null ? "Time unavailable" : `${linked.processing_time_seconds}s`}</span>}</div>{group.key === "responses" ? <><p className="subtext">Model #{linked.llm_model_id} · <Link href={`/studio/steps/${linked.humor_flavor_step_id}`}>Step #{linked.humor_flavor_step_id}</Link></p><pre className="course-output">{String(linked.llm_model_response || "No response content recorded.")}</pre></> : group.key === "steps" ? <><p className="subtext">Step {linked.order_by} · Model #{linked.llm_model_id}</p><p className="course-snippet">{linked.description || linked.llm_user_prompt || "No description recorded."}</p></> : group.key === "content" ? <p className="course-snippet">{linked.content}</p> : <p className="subtext">{String(linked.created_datetime_utc)}</p>}</article>)}</div> : <p className="empty muted">No linked records.</p>}{group.count > 10 && <p className="course-related-note">Showing 10 of {group.count.toLocaleString()}. <Link className="text-link" href={group.href}>View the full list</Link></p>}</section>)}
  </>;
}
