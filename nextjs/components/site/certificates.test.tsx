import { test, expect, describe, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import { CertificatesView } from './certificates-view';
import { CertCard } from './cert-lightbox-home';
import type { Certificate } from '@/content/site';

afterEach(cleanup);

describe('CertificatesView (rows)', () => {
  test('renders issuer and title for each certificate', () => {
    const certs: Certificate[] = [{ issuer: 'NVIDIA', title: 'AI for All' }];
    render(<CertificatesView certificates={certs} />);
    expect(screen.getByText('NVIDIA')).toBeDefined();
    expect(screen.getByText('AI for All')).toBeDefined();
  });

  test('shows the issued year next to the title when present', () => {
    const certs: Certificate[] = [{ issuer: 'Coursera', title: 'GenAI', issuedYear: 2024 }];
    render(<CertificatesView certificates={certs} />);
    expect(screen.getByText('· 2024')).toBeDefined();
  });

  test('renders each row as a button that opens the lightbox', () => {
    const certs: Certificate[] = [
      { issuer: 'NVIDIA', title: 'AI for All' },
      { issuer: 'SET', title: 'Mindset' },
    ];
    const { container } = render(<CertificatesView certificates={certs} />);
    const rows = container.querySelectorAll('button.crow');
    expect(rows.length).toBe(2);
  });
});

describe('CertCard (lightbox body)', () => {
  test('renders a PDF link when full_image is a .pdf', () => {
    const cert: Certificate = {
      issuer: 'SET',
      title: 'Entrepreneurial Mindset',
      fullImage: 'https://cdn/set.pdf',
    };
    const { container } = render(<CertCard cert={cert} />);
    const link = container.querySelector('a[href="https://cdn/set.pdf"]');
    expect(link).not.toBeNull();
    expect(link?.textContent).toContain('PDF');
  });

  test('renders the full_image as an <img> when it is not a PDF', () => {
    const cert: Certificate = {
      issuer: 'NVIDIA',
      title: 'AI for All',
      fullImage: 'https://cdn/nvidia.png',
    };
    const { container } = render(<CertCard cert={cert} />);
    const img = container.querySelector('img.cert-preview-img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('https://cdn/nvidia.png');
  });

  test('renders a verify link when verifyUrl is present', () => {
    const cert: Certificate = {
      issuer: 'Coursera',
      title: 'GenAI',
      verifyUrl: 'https://coursera.org/verify/abc',
    };
    const { container } = render(<CertCard cert={cert} />);
    const link = container.querySelector('a[href="https://coursera.org/verify/abc"]');
    expect(link).not.toBeNull();
  });

  test('falls back to a typographic card when there is no image', () => {
    const cert: Certificate = { issuer: 'NVIDIA', title: 'AI for All' };
    render(<CertCard cert={cert} />);
    expect(screen.getByText('NVIDIA')).toBeDefined();
    expect(screen.getByText('AI for All')).toBeDefined();
  });
});
