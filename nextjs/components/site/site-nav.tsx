import Link from 'next/link';

/** Sticky liquid-glass nav (Requirement §4.1.1). */
export function SiteNav() {
  return (
    <nav>
      <div className="brand">
        <i />
        T4&nbsp;Labs
      </div>
      <div className="nlinks">
        <Link href="#work">Work</Link>
        <Link href="#services">Services</Link>
        <Link href="#process">Process</Link>
        <Link href="#certs">Credentials</Link>
        <Link href="/chat">AI</Link>
        <Link href="#" aria-label="Switch language">
          TH / EN
        </Link>
      </div>
      <Link href="/contact" className="btn">
        Start a project <span>&rarr;</span>
      </Link>
    </nav>
  );
}
