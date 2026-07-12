import { SiteNav } from '@/components/site/site-nav';
import { Hero } from '@/components/site/hero';
import { SolutionSelector } from '@/components/site/solution-selector';
import { ProjectGallery } from '@/components/site/project-gallery';
import { ServiceList } from '@/components/site/service-list';
import { ProcessSchematic } from '@/components/site/process-schematic';
import { Certificates } from '@/components/site/certificates';
import { CtaSection } from '@/components/site/cta-section';
import { SiteFooter } from '@/components/site/site-footer';
import { ChatButton } from '@/components/site/chat-button';
import { RevealObserver } from '@/components/site/reveal-observer';

export default function Home() {
  return (
    <>
      <SiteNav />
      <div className="wrap">
        <Hero />
        <SolutionSelector />
        <ProjectGallery />
        <ServiceList />
        <ProcessSchematic />
        <Certificates />
        <CtaSection />
        <SiteFooter />
      </div>
      <ChatButton />
      <RevealObserver />
    </>
  );
}
