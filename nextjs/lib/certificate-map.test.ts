import { test, expect, describe } from 'bun:test';
import { mapDbCertificate, isPdfUrl } from './certificate-map';

describe('mapDbCertificate', () => {
  test('maps all DB snake_case columns to the view model', () => {
    const c = mapDbCertificate({
      title: 'GenAI for Application Developers',
      title_en: 'GenAI for Application Developers',
      issuer: 'Coursera',
      issuer_logo: 'https://cdn/coursera.png',
      issued_year: 2024,
      thumbnail: 'https://cdn/thumb.png',
      full_image: 'https://cdn/full.png',
      verify_url: 'https://coursera.org/verify/abc',
    });
    expect(c).toEqual({
      title: 'GenAI for Application Developers',
      titleEn: 'GenAI for Application Developers',
      issuer: 'Coursera',
      issuerLogo: 'https://cdn/coursera.png',
      issuedYear: 2024,
      thumbnail: 'https://cdn/thumb.png',
      fullImage: 'https://cdn/full.png',
      verifyUrl: 'https://coursera.org/verify/abc',
    });
  });

  test('nullable columns become undefined, not null', () => {
    const c = mapDbCertificate({
      title: 'Cyber Security Awareness',
      issuer: 'สถาบันพัฒนาบุคลากรภาครัฐด้านดิจิทัล',
      title_en: null,
      issuer_logo: null,
      issued_year: null,
      thumbnail: null,
      full_image: null,
      verify_url: null,
    });
    expect(c.titleEn).toBeUndefined();
    expect(c.issuerLogo).toBeUndefined();
    expect(c.issuedYear).toBeUndefined();
    expect(c.thumbnail).toBeUndefined();
    expect(c.fullImage).toBeUndefined();
    expect(c.verifyUrl).toBeUndefined();
  });
});

describe('isPdfUrl', () => {
  test('recognizes a .pdf file', () => {
    expect(isPdfUrl('https://cdn.example.com/certs/nvidia.pdf')).toBe(true);
  });

  test('recognizes a .pdf file with a query string', () => {
    expect(isPdfUrl('https://cdn.example.com/certs/nvidia.pdf?token=abc')).toBe(true);
  });

  test('rejects an image file', () => {
    expect(isPdfUrl('https://cdn.example.com/certs/nvidia.png')).toBe(false);
  });

  test('rejects undefined', () => {
    expect(isPdfUrl(undefined)).toBe(false);
  });
});
