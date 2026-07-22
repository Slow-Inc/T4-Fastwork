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
import { facetsFor } from "@/content/catalog";
import { metricsFromStats } from "@/content/site";
import { getAllProjects, getProjectRankMap } from "@/lib/projects-repo";
import { getSiteStats } from "@/lib/site-stats";
import { TeamTechSection } from "@/components/site/team-tech-section";
import { CtaSection } from "@/components/site/cta-section";
import { SiteFooter } from "@/components/site/site-footer";
import { ChatButton } from "@/components/site/chat-button";
import { RevealObserver } from "@/components/site/reveal-observer";
import { CountUpObserver } from "@/components/site/count-up-observer";
import { SmoothScroll } from "@/components/site/smooth-scroll";

export default async function Home() {
  // DB-only showcase: the featured carousel + tech chips come from the published
  // projects (admin-editable). The AI display-rank map still orders the separate
  // "Selected work" editorial mosaic. Live headline stats drive the hero band.
  const [all, rank, stats] = await Promise.all([
    getAllProjects(),
    getProjectRankMap(),
    getSiteStats(),
  ]);
  const featured = all.filter((p) => p.isFeatured);
  const techs = facetsFor(all).technologies;
  return (
    <>
      <SiteNav />
      <div className="wrap">
        <Hero
          metrics={metricsFromStats(stats)}
          years={stats.years}
          projects={stats.projects}
        />
        <TeamTechSection />
        <FeaturedCarousel projects={featured} />
        <SolutionSelector />
        <ProjectGallery order={rank} />
        <ServiceList />
        <ProcessSchematic />
        <SdlcSection />
        <TeamSection />
        <TechStack techs={techs} />
        <Certificates />
        <CtaSection />
        <SiteFooter />
      </div>
      <ChatButton />
      <RevealObserver />
      <CountUpObserver />
      <SmoothScroll />
    </>
  );
}
