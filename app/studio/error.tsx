"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="empty"><h2>Couldn’t load this page.</h2><p className="muted">Please try again.</p><button onClick={reset} className="button secondary">Try again</button></div>; }
