/**
 * Maps a tech-stack label to a vendored simple-icons SVG (rendered monochrome via
 * CSS `mask-image`, so it inherits the editorial ink/accent colour). Labels with no
 * real brand mark — or brands simple-icons dropped for policy reasons (Adobe, Canva) —
 * return `null`, and the UI falls back to a plain text chip.
 *
 * Keyed by the base brand (the part before any "(...)" qualifier) so that members who
 * list the same brand with different scopes still resolve to one icon.
 */
const BASE_TO_SLUG: Record<string, string> = {
  'Next.js': 'nextdotjs',
  'Vite.js': 'vite',
  'React.js': 'react',
  'Nest.js': 'nestjs',
  'Express.js': 'express',
  'Nuxt.js': 'nuxt',
  'Vue.js': 'vuedotjs',
  Vercel: 'vercel',
  Tailscale: 'tailscale',
  Nginx: 'nginx',
  Figma: 'figma',
  Cloudflare: 'cloudflare',
  MongoDB: 'mongodb',
  MySQL: 'mysql',
  Supabase: 'supabase',
  Firebase: 'firebase',
  Fastify: 'fastify',
  'LINE OA': 'line',
  'Kali Linux': 'kalilinux',
  Flutter: 'flutter',
  'DaVinci Resolve': 'davinciresolve',
  VMware: 'vmware',
  'Burp Suite': 'burpsuite',
};

/** `/tech/<slug>.svg` for a known brand, else `null` (→ text-chip fallback). */
export function techLogo(name: string): string | null {
  const base = name.split('(')[0].trim();
  const slug = BASE_TO_SLUG[base];
  return slug ? `/tech/${slug}.svg` : null;
}
