import type { Metadata } from 'next';
import { Lab4Home } from '@/components/site/lab4/lab4-home';

export const metadata: Metadata = {
  title: 'Lab4 — v3 prototype: Robot storytelling × dual theme',
  robots: { index: false, follow: false },
};

// the prototype route and the live home now render the SAME component, so they
// cannot drift; the composition itself lives in components/site/lab4/lab4-home
export default function Lab4Page() {
  return <Lab4Home />;
}
