'use client';

import { useState } from 'react';
import type { Certificate } from '@/content/site';
import { useLocale } from '@/i18n/locale-context';
import { CertificatesView } from './certificates-view';
import { CertLightboxHome } from './cert-lightbox-home';

/** Client shell for the credentials section — wires row clicks to the lightbox. */
export function CertificatesGallery({
  certificates,
  idx = '05 — Credentials',
}: {
  certificates: Certificate[];
  idx?: string;
}) {
  const { locale } = useLocale();
  const [active, setActive] = useState<number | null>(null);
  return (
    <>
      <CertificatesView certificates={certificates} onOpen={setActive} idx={idx} />
      <CertLightboxHome
        cert={active !== null ? certificates[active] : null}
        en={locale === 'en'}
        onClose={() => setActive(null)}
      />
    </>
  );
}
