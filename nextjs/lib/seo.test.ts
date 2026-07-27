import { test, expect, describe } from 'bun:test';
import { jsonLdHtml, pageAlternates } from './seo';

describe('pageAlternates', () => {
  test('self-references the given path as canonical', () => {
    const a = pageAlternates('/about');
    expect(a.canonical).toBe('/about');
  });

  test('declares th/en/x-default hreflang alternates for the same path', () => {
    const a = pageAlternates('/blog/rag-chatbot-for-business');
    expect(a.languages).toEqual({
      th: '/blog/rag-chatbot-for-business',
      en: '/blog/rag-chatbot-for-business',
      'x-default': '/blog/rag-chatbot-for-business',
    });
  });

  test('defaults to the homepage when no path is given', () => {
    const a = pageAlternates();
    expect(a.canonical).toBe('/');
    expect(a.languages.th).toBe('/');
  });
});

describe('jsonLdHtml', () => {
  test('never emits a closing script sequence, even when a value contains one', () => {
    // The whole point: inside <script> the HTML parser is in script-data state, so a literal
    // </script> in a string value ends the element early and the rest of the document is parsed
    // as markup. JSON.stringify does not escape `<`.
    const html = jsonLdHtml({ name: '</script><img src=x>' });
    expect(html.includes('</script')).toBe(false);
    expect(html.includes('<')).toBe(false);
    expect(html.includes('>')).toBe(false);
  });

  test('escapes < > & as unicode sequences so the output is still valid JSON', () => {
    const html = jsonLdHtml({ a: '<', b: '>', c: '&' });
    expect(html).toContain('\\u003c');
    expect(html).toContain('\\u003e');
    expect(html).toContain('\\u0026');
  });

  test('round-trips: a consumer parsing the output gets the original value back', () => {
    const value = {
      '@context': 'https://schema.org',
      name: 'T4 <Labs> & Co',
      keywords: ['</script>', 'เว็บแอปพลิเคชัน', 'C++'],
      nested: { deep: ['<a href="x">', 5, true, null] },
    };
    expect(JSON.parse(jsonLdHtml(value))).toEqual(value);
  });

  test('escapes inside nested arrays and object keys, not just top-level strings', () => {
    const html = jsonLdHtml({ '<key>': ['<v1>', { '<k2>': '<v2>' }] });
    expect(html.includes('<')).toBe(false);
    expect(JSON.parse(html)).toEqual({ '<key>': ['<v1>', { '<k2>': '<v2>' }] });
  });

  test('serialises an array payload, which the root layout uses', () => {
    const html = jsonLdHtml([{ '@type': 'Organization' }, { '@type': 'WebSite' }]);
    expect(JSON.parse(html)).toHaveLength(2);
  });
});
