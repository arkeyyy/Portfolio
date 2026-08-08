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
  const [isInterfaceHidden, setIsInterfaceHidden] = useState(false);
  const [isBackgroundHintVisible, setIsBackgroundHintVisible] = useState(false);

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

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('background-view-active', isInterfaceHidden);

    if (!isInterfaceHidden) {
      return () => root.classList.remove('background-view-active');
    }

    const revealFromClick = (event: MouseEvent) => {
      if (event.button === 0) {
        setIsBackgroundHintVisible(false);
        setIsInterfaceHidden(false);
      }
    };
    const revealFromKeyboard = (event: KeyboardEvent) => {
      if (
        event.key === ' '
        || event.key.startsWith('Arrow')
        || event.key === 'PageDown'
        || event.key === 'PageUp'
      ) {
        event.preventDefault();
      }
      setIsBackgroundHintVisible(false);
      setIsInterfaceHidden(false);
    };

    window.addEventListener('click', revealFromClick, true);
    window.addEventListener('keydown', revealFromKeyboard, true);

    return () => {
      root.classList.remove('background-view-active');
      window.removeEventListener('click', revealFromClick, true);
      window.removeEventListener('keydown', revealFromKeyboard, true);
    };
  }, [isInterfaceHidden]);

  useEffect(() => {
    if (!isInterfaceHidden) return;

    let timeout: number | undefined;
    const frame = window.requestAnimationFrame(() => {
      setIsBackgroundHintVisible(true);
      timeout = window.setTimeout(() => {
        setIsBackgroundHintVisible(false);
      }, 1320);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, [isInterfaceHidden]);

  const activeTheme = sectionById[activeSection];
  const shellStyle = {
    '--active-color': activeTheme.color,
    '--active-ink': activeTheme.ink,
  } as CSSProperties;

  return (
    <div
      className={`portfolio-shell ${isInterfaceHidden ? 'is-interface-hidden' : ''}`}
      style={shellStyle}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <AnimatedBackground activeColor={activeTheme.color} />

      <div
        className="site-interface"
        aria-hidden={isInterfaceHidden}
        inert={isInterfaceHidden ? true : undefined}
      >
        <Navbar
          activeSection={activeSection}
          onHideInterface={() => {
            setIsBackgroundHintVisible(false);
            setIsInterfaceHidden(true);
          }}
        />

        <div className="site-content">
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

      {isInterfaceHidden && (
        <div
          className={`background-view-hint ${isBackgroundHintVisible ? 'is-visible' : ''}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          Press any key to show UI
        </div>
      )}
    </div>
  );
}

export default App
