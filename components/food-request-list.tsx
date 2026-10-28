import Link from 'next/link';
import type { FoodRequest } from '@/lib/food-traces';
import { milliseconds, requestStatus } from '@/lib/food-traces';
import { Empty } from './ui';
export default function FoodRequestList({ rows, filtered = false }: { rows: FoodRequest[]; filtered?: boolean }) {
  if (!rows.length) return filtered ? <Empty title="No matching requests">Try another search or status</Empty> : <Empty title="No generation requests yet">New recommendations from the food app will appear here. Older picks have no recorded trace.</Empty>;
  return <div className="table-scroll"><table><thead><tr><th>Request</th><th>Input</th><th>Result</th><th>Status</th><th>Duration</th><th>Created (UTC)</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}>
    <td><Link className="record-reference" href={`/admin/requests/${row.id}`}>{row.id.slice(0, 8)} ↗</Link></td>
    <td className="content-preview"><p>{row.user_input}</p><small className="subtext">{[row.cuisine, row.neighborhood].filter(Boolean).join(' · ') || 'Any cuisine · Anywhere in NYC'}</small></td>
    <td>{row.result_title || '—'}</td><td><span className={`pill food-status ${row.status}`}>{requestStatus(row)}</span></td><td>{milliseconds(row.duration_ms)}</td>
    <td className="nowrap">{new Date(row.created_at).toLocaleString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
  </tr>)}</tbody></table></div>;
}
