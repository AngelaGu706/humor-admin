"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <section className="panel empty" role="alert"><h2>Couldn’t load this page.</h2><p className="muted">Please try again.</p><button className="button primary" onClick={() => reset()}>Try again</button></section>; }
