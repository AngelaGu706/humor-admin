"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <section className="panel empty" role="alert"><h2>Couldn’t load this view.</h2><p className="muted">Your data is still safe. Please try loading it again.</p><button className="button primary" onClick={() => reset()}>Try again</button></section>; }
