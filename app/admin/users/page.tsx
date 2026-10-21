import { profiles, pageNumber, displayName } from "@/lib/data";
import { PageHeading, Pagination, Empty, ReadOnly } from "@/components/ui";
export default async function Users({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = pageNumber((await searchParams).page);
  const { rows, count } = await profiles(page);
  return <><PageHeading title="The people behind the picks." description="Browse community profiles and administrator status."><ReadOnly/></PageHeading><section className="panel table-panel"><div className="panel-heading"><h2>Community members <span className="count">{count.toLocaleString()}</span></h2></div>{rows.length ? <div className="table-scroll"><table><thead><tr><th>Member</th><th>User ID</th><th>Access</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><div className="person"><div className="avatar">{displayName(row)[0]}</div><strong>{displayName(row)}</strong></div></td><td><code>{row.id}</code></td><td><span className={`pill ${row.is_superadmin ? "olive" : ""}`}>{row.is_superadmin ? "Super admin" : "Member"}</span></td></tr>)}</tbody></table></div> : <Empty title="No profiles on this page">Members appear here after joining the app.</Empty>}<Pagination page={page} count={count} base="/admin/users"/></section></>;
}
