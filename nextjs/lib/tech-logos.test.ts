import { describe, it, expect } from 'bun:test';
import { techLogo } from './tech-logos';

describe('techLogo', () => {
  it('maps known brands to their vendored SVG path', () => {
    expect(techLogo('Next.js')).toBe('/tech/nextdotjs.svg');
    expect(techLogo('React.js')).toBe('/tech/react.svg');
    expect(techLogo('Nest.js')).toBe('/tech/nestjs.svg');
    expect(techLogo('Vue.js')).toBe('/tech/vuedotjs.svg');
    expect(techLogo('Nuxt.js')).toBe('/tech/nuxt.svg');
    expect(techLogo('MongoDB')).toBe('/tech/mongodb.svg');
    expect(techLogo('MySQL')).toBe('/tech/mysql.svg');
    expect(techLogo('Flutter')).toBe('/tech/flutter.svg');
    expect(techLogo('Burp Suite')).toBe('/tech/burpsuite.svg');
    expect(techLogo('Kali Linux')).toBe('/tech/kalilinux.svg');
    expect(techLogo('DaVinci Resolve')).toBe('/tech/davinciresolve.svg');
    expect(techLogo('LINE OA')).toBe('/tech/line.svg');
  });

  it('ignores a parenthetical qualifier and matches the base brand', () => {
    // Different members list Cloudflare with different parenthetical scopes.
    expect(techLogo('Cloudflare (CDN, DNS, Tunnel)')).toBe('/tech/cloudflare.svg');
    expect(techLogo('Cloudflare (CDN, DNS, WAF, Tunnel)')).toBe('/tech/cloudflare.svg');
  });

  it('returns null for tools with no real brand mark (→ text-chip fallback)', () => {
    expect(techLogo('Radmin')).toBeNull();
    expect(techLogo('DNS')).toBeNull();
    expect(techLogo('DHCP')).toBeNull();
    expect(techLogo('Nmap')).toBeNull();
    expect(techLogo('Runpod')).toBeNull();
    expect(techLogo('Public Cloud (AWS, Azure, Google Cloud)')).toBeNull();
    // Adobe & Canva were removed from simple-icons (brand policy) → fallback.
    expect(techLogo('Adobe Photoshop')).toBeNull();
    expect(techLogo('Canva')).toBeNull();
  });
});
