'use client';

import Link, { type LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { trackCtaClick } from '@/app/actions/track-cta';

/**
 * A next/link that fires a fire-and-forget CTA-click analytics event
 * (Requirement §6.7) before navigating. Never blocks or delays the click.
 */
export function TrackedLink({
  ctaType,
  onClick,
  children,
  ...props
}: LinkProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { ctaType: string; children?: ReactNode }) {
  const pathname = usePathname();

  return (
    <Link
      {...props}
      onClick={(e) => {
        void trackCtaClick(pathname, ctaType);
        onClick?.(e);
      }}
    >
      {children}
    </Link>
  );
}
