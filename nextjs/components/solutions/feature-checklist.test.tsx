import { test, expect, describe, afterEach } from 'bun:test';
import { render, screen, cleanup } from '@testing-library/react';
import { FeatureChecklist } from './feature-checklist';

afterEach(cleanup);

const groups = [
  { title: 'Authentication', items: ['Login', '2FA'] },
  { title: 'Dashboard', items: ['KPI', 'Charts', 'Export'] },
];

describe('FeatureChecklist', () => {
  test('renders each group title', () => {
    render(<FeatureChecklist groups={groups} />);
    expect(screen.getByText('Authentication')).toBeDefined();
    expect(screen.getByText('Dashboard')).toBeDefined();
  });

  test('renders each feature item', () => {
    render(<FeatureChecklist groups={groups} />);
    expect(screen.getByText('Login')).toBeDefined();
    expect(screen.getByText('Export')).toBeDefined();
  });

  test('uses native <details> per group', () => {
    const { container } = render(<FeatureChecklist groups={groups} />);
    expect(container.querySelectorAll('details').length).toBe(groups.length);
  });

  test('shows the item count per group', () => {
    render(<FeatureChecklist groups={groups} />);
    expect(screen.getByText(/3 รายการ/)).toBeDefined();
  });
});
