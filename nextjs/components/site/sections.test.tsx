import { describe, it, expect, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import { ServiceListView } from './service-list';
import { ProjectGallery } from './project-gallery';
import { CertificatesView } from './certificates-view';
import { MetricBand } from './metric-band';
import { services } from '@/content/services';
import { featuredProjects } from '@/content/projects';
import { certificates } from '@/content/site';
import { metrics } from '@/content/site';

afterEach(cleanup);

describe('ServiceList', () => {
  it('renders every service', () => {
    render(<ServiceListView items={services} en={false} />);
    for (const s of services) expect(screen.getByText(s.title)).toBeDefined();
  });
});

describe('ProjectGallery', () => {
  it('renders every featured project and links to its detail page', () => {
    render(<ProjectGallery />);
    for (const p of featuredProjects) {
      const link = screen.getByRole('link', { name: new RegExp(p.name) });
      expect(link.getAttribute('href')).toBe(`/projects/${p.slug}`);
    }
  });
});

describe('Certificates', () => {
  it('renders every certificate title', () => {
    render(<CertificatesView certificates={certificates} />);
    for (const c of certificates)
      expect(screen.getAllByText(c.title).length).toBeGreaterThan(0);
  });

  it('shows the best 9 and tucks the rest behind a see-more disclosure', () => {
    const many = Array.from({ length: 11 }, (_, i) => ({
      issuer: `Iss${i}`,
      title: `Cert ${i}`,
    })) as unknown as typeof certificates;
    const { container } = render(<CertificatesView certificates={many} />);
    // First 9 are direct rows; the overflow (2) lives inside a <details>.
    expect(container.querySelectorAll('.ctable > .crow').length).toBe(9);
    const details = container.querySelector('details');
    expect(details).not.toBeNull();
    expect(details?.querySelectorAll('.crow').length).toBe(2);
    // Every title is still in the DOM (SEO / findable).
    for (let i = 0; i < 11; i++)
      expect(screen.getByText(`Cert ${i}`)).toBeDefined();
  });
});

describe('MetricBand', () => {
  it('renders every metric value', () => {
    render(<MetricBand />);
    for (const m of metrics) expect(screen.getByText(m.value)).toBeDefined();
  });
});
