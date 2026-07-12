import Script from 'next/script';

/**
 * reCAPTCHA v3 loader (Requirement §4.1.10 / §5.2 / §9). No-op unless
 * NEXT_PUBLIC_RECAPTCHA_SITE_KEY is set, so dev/build stay clean until a key
 * is configured — mirrors the Analytics component's feature-flag pattern.
 */
export function RecaptchaScript() {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) return null;

  return (
    <Script
      src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
      strategy="afterInteractive"
    />
  );
}
