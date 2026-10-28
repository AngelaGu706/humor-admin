import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { foodRequest, milliseconds, requestStatus, traceErrorMessage, validationStatus } from '@/lib/food-traces';
import { displayName } from '@/lib/data';
import { decodeContent } from '@/lib/content';
import { PageHeading, ReadOnly } from '@/components/ui';
const time = (value: string) => new Date(value).toLocaleString('en-US', { timeZone: 'UTC' });
function Output({ value }: { value: unknown }) { return <pre className="course-output food-full-output">{typeof value === 'string' ? value : JSON.stringify(value, null, 2)}</pre>; }
function ErrorDetail({ code }: { code: string }) { return <>{traceErrorMessage(code)}<small className="subtext"><code>{code}</code></small></>; }
const stepName = (kind: string) => kind === 'variety_retry' ? 'Find an alternative' : 'Generate a food pick';
export default async function Request({ params }: { params: Promise<{ id: string }> }) {
  const { request: row, steps, profile, generation } = await foodRequest((await params).id);
  const pick = row.result_content ? decodeContent(row.result_content) : null;
  const changed = generation && (generation.title !== row.result_title || generation.content !== row.result_content);
  const failedStep = row.status === 'failed' ? steps.filter(step => step.status === 'failed').at(-1) : undefined;
  return <><Link className="text-link course-back" href="/admin/requests"><ArrowLeft size={14}/>Requests</Link><PageHeading title={`Request ${row.id.slice(0, 8)}`} description="Input, model calls, and the saved pick."><ReadOnly/></PageHeading>
    <div className="course-flow food-trace-flow" aria-label="Food generation flow"><a href="#request-input">User input</a><ArrowRight size={16}/><a href="#request-steps">Generation steps</a><ArrowRight size={16}/><a href="#request-result">Recommendation</a></div>
    <section id="request-input" className="panel course-details"><div className="panel-heading"><h2>User input</h2><span className={`pill food-status ${row.status}`}>{requestStatus(row)}</span></div><dl>
      <div className="long-detail"><dt>Request ID</dt><dd>{row.id}</dd></div><div className="long-detail"><dt>Input</dt><dd className="food-preserve">{row.user_input}</dd></div>
      <div><dt>Cuisine</dt><dd>{row.cuisine || 'Any cuisine'}</dd></div><div><dt>Neighborhood</dt><dd>{row.neighborhood || 'Anywhere in NYC'}</dd></div>
      <div><dt>User</dt><dd>{displayName(profile)}<small className="subtext">{row.user_id}</small></dd></div><div><dt>Started (UTC)</dt><dd>{time(row.created_at)}</dd></div>
      <div><dt>Total duration</dt><dd>{milliseconds(row.duration_ms)}</dd></div><div><dt>Chain version</dt><dd>{row.chain_version}</dd></div>
      {row.error_code && <div className="long-detail"><dt>Error</dt><dd><ErrorDetail code={row.error_code}/></dd></div>}
      {failedStep && <div className="long-detail"><dt>Failed step</dt><dd><a className="text-link" href={`#request-step-${failedStep.id}`}>Step {failedStep.step_number}: {stepName(failedStep.kind)} ↓</a></dd></div>}
    </dl></section>
    <section id="request-steps" className="food-trace-steps"><div className="food-trace-heading"><h2>Generation steps</h2></div>
      {!steps.length && <p className="notice">No model calls recorded.</p>}
      {steps.map(step => <article className="panel course-details" id={`request-step-${step.id}`} key={step.id}><div className="panel-heading"><div><h2>Step {step.step_number}: {stepName(step.kind)}</h2><p>{step.provider} · {step.model} · {milliseconds(step.duration_ms)}</p></div><span className="pill">{row.selected_step_id === step.id ? <><CheckCircle2 size={13}/>Selected</> : step.status === 'failed' ? 'Failed' : step.status === 'running' ? 'Incomplete' : 'Not selected'}</span></div><dl>
        <div><dt>Validation</dt><dd>{validationStatus(step)}</dd></div><div><dt>Started (UTC)</dt><dd>{time(step.created_at)}</dd></div>
        {step.error_code && <div className="long-detail"><dt>Error</dt><dd><ErrorDetail code={step.error_code}/></dd></div>}
        <div className="long-detail"><dt>Prompt</dt><dd><Output value={step.prompt}/></dd></div>
        <div className="long-detail"><dt>Model response{step.output_truncated ? ' (truncated at 80,000 characters)' : ''}</dt><dd>{step.output_text ? <Output value={step.output_text}/> : 'No response text received.'}</dd></div>
      </dl><div className="food-step-extras">
        {step.parsed_result && <details><summary>Parsed result</summary><Output value={step.parsed_result}/></details>}
        <details><summary>Settings</summary><p className="muted">Automatic retries are included in the same step.</p><Output value={step.settings}/></details>
        {step.usage && <details><summary>Token usage</summary><Output value={step.usage}/></details>}
      </div></article>)}
    </section>
    <section id="request-result" className="panel course-details"><div className="panel-heading"><h2>Recommendation</h2>{generation && <Link className="text-link" href={`/admin/media?generation=${generation.id}`}>Manage pick ↗</Link>}</div><dl>
      {row.status === 'succeeded' ? <><div className="long-detail"><dt>Restaurant</dt><dd>{row.result_title}</dd></div>{pick ? <><div><dt>Dish</dt><dd>{pick.food}</dd></div><div><dt>Neighborhood / cuisine</dt><dd>{[pick.area, pick.cuisine].filter(Boolean).join(' · ')}</dd></div><div className="long-detail"><dt>Original recommendation</dt><dd>{pick.recommendation}</dd></div></> : <div className="long-detail"><dt>Original result</dt><dd><Output value={row.result_content}/></dd></div>}
      <div className="long-detail"><dt>Saved pick</dt><dd>{generation ? <>{generation.id}{changed && <p className="muted">This pick was edited after generation. The trace preserves the original output.</p>}</> : 'The pick has since been deleted. The original output is preserved above.'}</dd></div></> : <div className="long-detail"><dt>Result</dt><dd>No recommendation was saved.</dd></div>}
    </dl></section>
  </>;
}
