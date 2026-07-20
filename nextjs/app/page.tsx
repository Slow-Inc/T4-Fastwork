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
import { metricsFromStats } from "@/content/site";
import { getProjectRankMap } from "@/lib/projects-repo";
import { getSiteStats } from "@/lib/site-stats";
import { orderByRank } from "@/lib/project-rank";
import { TeamTechSection } from "@/components/site/team-tech-section";
import { CtaSection } from "@/components/site/cta-section";
import { SiteFooter } from "@/components/site/site-footer";
import { ChatButton } from "@/components/site/chat-button";
import { RevealObserver } from "@/components/site/reveal-observer";
import { CountUpObserver } from "@/components/site/count-up-observer";
import { SmoothScroll } from "@/components/site/smooth-scroll";
import { Lab4RobotStageLazy } from "@/components/site/lab4/lab4-robot-stage-lazy";

export default async function Home() {
  // AI display-rank (B5) orders the featured + selected work; content stays static.
  // Live headline stats (years/projects/certs) drive the hero band + proof line.
  const [rank, stats] = await Promise.all([getProjectRankMap(), getSiteStats()]);
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
        <FeaturedCarousel projects={orderByRank(filterProjects({ featured: true }), rank)} />
        <SolutionSelector />
        <ProjectGallery order={rank} />
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
      <SmoothScroll />
      {/* T4 Bot — the brand character graduated from the /lab4 prototype
          (requirement3 §14.2.1): one fixed stage, chasing the page's
          [data-l4-zone] markers (hero → closing CTA). */}
      <Lab4RobotStageLazy />
    </>
  );
}
