import './App.css'
import Navbar from './components/Navbar';
import AboutPage from './components/AboutPage';
import ProjectsPage from './components/ProjectsPage';
import SkillsPage from './components/SkillsPage';
import CertificationsPage from './components/CertificationsPage';
import EducationPage from './components/EducationPage';
import ContactPage from './components/ContactPage';
import Footer from './components/Footer';
import AnimatedBackground from './components/AnimatedBackground';
import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { isSectionId, sectionById, sections } from './sectionTheme';
import type { SectionId } from './sectionTheme';

function App() {
  const [activeSection, setActiveSection] = useState<SectionId>('about');

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-32% 0px -58% 0px',
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && isSectionId(entry.target.id)) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!isSectionId(hash)) return;

    const frame = window.requestAnimationFrame(() => {
      const root = document.documentElement;
      const previousScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      document.getElementById(hash)?.scrollIntoView({ block: 'start' });
      root.style.scrollBehavior = previousScrollBehavior;
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const activeTheme = sectionById[activeSection];
  const shellStyle = {
    '--active-color': activeTheme.color,
    '--active-ink': activeTheme.ink,
  } as CSSProperties;

  return (
    <div className="portfolio-shell" style={shellStyle}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <AnimatedBackground activeColor={activeTheme.color} />

      <div className="relative z-10">
        <Navbar activeSection={activeSection} />

        <main id="main-content" className="content-frame" tabIndex={-1}>
          <AboutPage />
          <ProjectsPage />
          <SkillsPage />
          <CertificationsPage />
          <EducationPage />
          <ContactPage />
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default App
