import { SiteNav } from "@/components/site/site-nav";
import { Hero } from "@/components/site/hero";
import { SolutionSelector } from "@/components/site/solution-selector";
import { ProjectGallery } from "@/components/site/project-gallery";
import { ServiceList } from "@/components/site/service-list";
import { ProcessSchematic } from "@/components/site/process-schematic";
import { SdlcSection } from "@/components/site/sdlc-section";
import { TechStack } from "@/components/site/tech-stack";
import { TeamSection } from "@/components/site/team-section";
import { FeaturedCarousel } from "@/components/site/featured-carousel";
import { Certificates } from "@/components/site/certificates";
import { projectTechnologies, filterProjects } from "@/content/catalog";
import { TeamTechSection } from "@/components/site/team-tech-section";
import { CtaSection } from "@/components/site/cta-section";
import { SiteFooter } from "@/components/site/site-footer";
import { ChatButton } from "@/components/site/chat-button";
import { RevealObserver } from "@/components/site/reveal-observer";
import { CountUpObserver } from "@/components/site/count-up-observer";

export default function Home() {
  return (
    <>
      <SiteNav />
      <div className="wrap">
        <Hero />
        <TeamTechSection />
        <FeaturedCarousel projects={filterProjects({ featured: true })} />
        <SolutionSelector />
        <ProjectGallery />
        <ServiceList />
        <ProcessSchematic />
        <SdlcSection />
        <TeamSection />
        <TechStack techs={projectTechnologies} />
        <Certificates />
        <CtaSection />
        <SiteFooter />
      </div>
      <ChatButton />
      <RevealObserver />
      <CountUpObserver />
    </>
  );
}
