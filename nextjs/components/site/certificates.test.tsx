import { test, expect, describe, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import { CertificatesView } from './certificates';
import type { Certificate } from '@/content/site';

afterEach(cleanup);

describe('CertificatesView', () => {
  test('renders issuer and title for each certificate', () => {
    const certs: Certificate[] = [{ issuer: 'NVIDIA', title: 'AI for All' }];
    render(<CertificatesView certificates={certs} />);
    // Appears in both the row and the fallback modal preview (no image configured).
    expect(screen.getAllByText('NVIDIA').length).toBeGreaterThan(0);
    expect(screen.getAllByText('AI for All').length).toBeGreaterThan(0);
  });

  test('shows the issued year next to the title when present', () => {
    const certs: Certificate[] = [{ issuer: 'Coursera', title: 'GenAI', issuedYear: 2024 }];
    render(<CertificatesView certificates={certs} />);
    expect(screen.getByText('· 2024')).toBeDefined();
  });

  test('renders a PDF link in the modal when full_image is a .pdf', () => {
    const certs: Certificate[] = [
      { issuer: 'SET', title: 'Entrepreneurial Mindset', fullImage: 'https://cdn/set.pdf' },
    ];
    const { container } = render(<CertificatesView certificates={certs} />);
    const link = container.querySelector('a[href="https://cdn/set.pdf"]');
    expect(link).not.toBeNull();
    expect(link?.textContent).toContain('PDF');
  });

  test('renders the full_image as an <img> when it is not a PDF', () => {
    const certs: Certificate[] = [
      { issuer: 'NVIDIA', title: 'AI for All', fullImage: 'https://cdn/nvidia.png' },
    ];
    const { container } = render(<CertificatesView certificates={certs} />);
    const img = container.querySelector('img.cert-preview-img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('https://cdn/nvidia.png');
  });

  test('renders a verify link when verifyUrl is present', () => {
    const certs: Certificate[] = [
      { issuer: 'Coursera', title: 'GenAI', verifyUrl: 'https://coursera.org/verify/abc' },
    ];
    const { container } = render(<CertificatesView certificates={certs} />);
    const link = container.querySelector('a[href="https://coursera.org/verify/abc"]');
    expect(link).not.toBeNull();
  });
});
