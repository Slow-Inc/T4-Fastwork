'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { TeamMember, TeamCertificate } from '@/content/site';
import type { LiveRepo } from '@/lib/github';
import { useLocale } from '@/i18n/locale-context';
import { TeamMemberView } from '@/components/site/team-member-view';
import { CertLightbox } from '@/components/site/cert-lightbox';

/** Client shell for a member profile page — wires locale + the certificate lightbox. */
export function TeamMemberContent({
  member,
  liveRepos,
}: {
  member: TeamMember;
  liveRepos?: LiveRepo[] | null;
}) {
  const { locale } = useLocale();
  const en = locale === 'en';
  const [active, setActive] = useState<TeamCertificate | null>(null);

  return (
    <div className="section section-page tm-wrap">
      <TeamMemberView
        member={member}
        en={en}
        onOpenCert={setActive}
        liveRepos={liveRepos}
      />
      <Link href="/about#team" className="tm-back">
        ← {en ? 'Back to the team' : 'กลับไปหน้าทีม'}
      </Link>
      <CertLightbox cert={active} en={en} onClose={() => setActive(null)} />
    </div>
  );
}
