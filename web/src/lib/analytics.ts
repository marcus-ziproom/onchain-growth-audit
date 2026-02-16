export async function trackEvent(event: string) {
  try {
    const key = `evt_${event}`.replace(/[^a-zA-Z0-9_]/g, "_");
    await fetch(`https://api.countapi.xyz/hit/chainpulselabs/${key}`);
  } catch {}
}

export function getUtmContext() {
  const url = new URL(window.location.href);
  const params = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "ref",
  ] as const;
  const ctx: Record<string, string> = {};
  params.forEach((p) => {
    const v = url.searchParams.get(p);
    if (v) ctx[p] = v;
  });
  return ctx;
}
