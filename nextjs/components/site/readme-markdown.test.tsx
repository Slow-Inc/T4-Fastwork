import { describe, it, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { ReadmeMarkdown } from './readme-markdown';

/**
 * The GitHub profile README is HTML-heavy (shields.io badges wrapped in
 * <a><img>, <p align>, Setext headings). It is also member-editable
 * (readmeOverride) — an XSS surface — so it is rendered through
 * react-markdown + rehype-raw + rehype-sanitize. These tests pin both the
 * fidelity (real GitHub READMEs render) and the safety (dangerous HTML is
 * stripped).
 */
describe('ReadmeMarkdown', () => {
  it('renders a shields.io badge embedded as raw <a><img> HTML', () => {
    const src =
      '<a href="https://github.com/xenodeve"><img src="https://img.shields.io/github/followers/xenodeve" alt="followers" /></a>';
    const { container } = render(<ReadmeMarkdown source={src} />);
    const img = container.querySelector('img');
    expect(img?.getAttribute('src')).toContain('img.shields.io');
    expect(container.querySelector('a')?.getAttribute('href')).toContain(
      'github.com/xenodeve',
    );
  });

  it('renders a Setext heading (underlined with ===) as a heading', () => {
    const { container } = render(
      <ReadmeMarkdown source={'My name is Tun\n=============\n\nhello'} />,
    );
    expect(container.querySelector('h1')?.textContent).toContain('My name is Tun');
  });

  it('renders GFM tables and standard markdown', () => {
    const src = '| A | B |\n| - | - |\n| 1 | 2 |';
    const { container } = render(<ReadmeMarkdown source={src} />);
    expect(container.querySelector('table')).not.toBeNull();
  });

  it('strips <script> tags (XSS from member-editable readmeOverride)', () => {
    const { container } = render(
      <ReadmeMarkdown source={'ok<script>window.__xss=1</script>done'} />,
    );
    expect(container.querySelector('script')).toBeNull();
  });

  it('strips inline event-handler attributes like onerror', () => {
    const { container } = render(
      <ReadmeMarkdown source={'<img src="x" onerror="window.__xss=1" alt="x" />'} />,
    );
    expect(container.querySelector('img')?.getAttribute('onerror')).toBeNull();
  });

  it('drops javascript: URLs on links', () => {
    const { container } = render(
      <ReadmeMarkdown source={'<a href="javascript:alert(1)">x</a>'} />,
    );
    const href = container.querySelector('a')?.getAttribute('href') ?? '';
    expect(href.startsWith('javascript:')).toBe(false);
  });
});
