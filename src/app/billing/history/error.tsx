'use client';
export default function Error({ reset }: { reset: () => void }) { return <button onClick={reset}>Retry</button>; }
