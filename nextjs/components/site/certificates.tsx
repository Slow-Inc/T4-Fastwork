import { getCertificates } from '@/lib/certificates-repo';
import { CertificatesGallery } from './certificates-gallery';

/** Fetches certificates (DB with static fallback) and renders the client gallery. */
export async function Certificates({ idx = '05 — Credentials' }: { idx?: string } = {}) {
  const certificates = await getCertificates();
  return <CertificatesGallery certificates={certificates} idx={idx} />;
}
