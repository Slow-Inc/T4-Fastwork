import Script from 'next/script';

/**
 * Cloudflare Turnstile loader (Requirement §4.1.10 / §5.2 / §9). No-op unless
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, so dev/build stay clean until a key is
 * configured — mirrors the Analytics component's feature-flag pattern. The script
 * implicitly renders any `.cf-turnstile` widget on the page.
 */
export function TurnstileScript() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;

  return (
    <Script
      src="https://challenges.cloudflare.com/turnstile/v0/api.js"
      strategy="afterInteractive"
    />
  );
}
