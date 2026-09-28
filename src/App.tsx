import './App.css'
import Navbar from './components/Navbar';
import AboutPage from './components/AboutPage';
import ProjectsPage from './components/ProjectsPage';
import SkillsPage from './components/SkillsPage';
import CertificationsPage from './components/CertificationsPage';
import EducationPage from './components/EducationPage';
import ContactPage from './components/ContactPage';
import Footer from './components/Footer';
import RenderDarkMode from './components/DarkMode/RenderDarkMode';
import RenderLightMode from './components/LightMode/RenderLightMode';
import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { isSectionId, sectionById, sections } from './sectionTheme';
import type { SectionId } from './sectionTheme';
import type {
  DarkRendererSnapshot,
  DeviceOrientationSession,
  DeviceOrientationSessionState,
  LightRendererSnapshot,
  RendererSession,
} from './background-renderer/session';
import { requestDeviceOrientationPermission } from './background-renderer/session';
import { prewarmBackgroundRenderer } from './background-renderer/prewarm';
import {
  getInitialScrollTarget,
  restoreScrollPosition,
  saveScrollPosition,
} from './background-renderer/boot';

const THEME_STORAGE_KEY = 'aldrin-portfolio-theme';
const DARK_THEME_COLOR = '#0b0c0f';
const LIGHT_THEME_COLOR = '#e9edf7';
const LIGHT_MODE_AVAILABLE: boolean = true;

function getInitialTheme() {
  if (!LIGHT_MODE_AVAILABLE) return true;

  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'dark') return true;
    if (savedTheme === 'light') return false;
  } catch {
    // Storage can be unavailable in hardened/private browser contexts.
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function App() {
  const [initialScrollTarget] = useState(getInitialScrollTarget);
  const darkRendererSnapshotRef = useRef<DarkRendererSnapshot | null>(null);
  const lightRendererSnapshotRef = useRef<LightRendererSnapshot | null>(null);
  const deviceOrientationStateRef = useRef<DeviceOrientationSessionState>({
    status: 'unresolved',
    pendingRequest: null,
  });
  const darkRendererSession = useMemo<RendererSession<DarkRendererSnapshot>>(
    () => ({
      readSnapshot: () => darkRendererSnapshotRef.current,
      writeSnapshot: (snapshot) => {
        darkRendererSnapshotRef.current = snapshot;
      },
    }),
    [],
  );
  const lightRendererSession = useMemo<RendererSession<LightRendererSnapshot>>(
    () => ({
      readSnapshot: () => lightRendererSnapshotRef.current,
      writeSnapshot: (snapshot) => {
        lightRendererSnapshotRef.current = snapshot;
      },
    }),
    [],
  );
  const deviceOrientationSession = useMemo<DeviceOrientationSession>(
    () => ({
      getStatus: () => deviceOrientationStateRef.current.status,
      getPendingRequest: () => deviceOrientationStateRef.current.pendingRequest,
      requestPermission: (requestPermission) => requestDeviceOrientationPermission(
        deviceOrientationStateRef.current,
        requestPermission,
      ),
      recoverOrphanedRequest: () => {
        const state = deviceOrientationStateRef.current;
        if (state.status === 'requesting' && !state.pendingRequest) {
          state.status = 'unresolved';
        }
      },
    }),
    [],
  );
  const [activeSection, setActiveSection] = useState<SectionId>(initialScrollTarget.section);
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);
  const [hasFirstPaint, setHasFirstPaint] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);
  const [isInterfaceHidden, setIsInterfaceHidden] = useState(false);
  const [isBackgroundHintVisible, setIsBackgroundHintVisible] = useState(false);
  const isLightModeActive = LIGHT_MODE_AVAILABLE && !isDarkMode;
  const isDarkModeActive = !isLightModeActive;
  const handleFirstPaint = useCallback(() => {
    document.documentElement.classList.add('background-ambience-ready');
    setHasFirstPaint(true);
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDarkModeActive);
    root.style.colorScheme = isDarkModeActive ? 'dark' : 'light';
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        'content',
        isDarkModeActive ? DARK_THEME_COLOR : LIGHT_THEME_COLOR,
      );

    if (!LIGHT_MODE_AVAILABLE) return;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
    } catch {
      // Theme still works for the current visit when storage is unavailable.
    }
  }, [isDarkMode, isDarkModeActive]);

  useEffect(() => {
    if (!hasFirstPaint || !hasRevealed) return;
    let prewarmed = false;
    let delayElapsed = false;
    let fallbackTimer: number | undefined;
    let idleCallback: number | undefined;
    const prewarmInactiveRenderer = () => {
      fallbackTimer = undefined;
      idleCallback = undefined;
      if (document.hidden) return;
      prewarmed = true;
      prewarmBackgroundRenderer(isLightModeActive ? 'dark' : 'light');
    };
    const idleWindow = window as typeof window & {
      requestIdleCallback?: Window['requestIdleCallback'];
      cancelIdleCallback?: Window['cancelIdleCallback'];
    };
    const queuePrewarm = () => {
      if (prewarmed || document.hidden) return;
      if (idleCallback !== undefined && idleWindow.cancelIdleCallback) {
        idleWindow.cancelIdleCallback(idleCallback);
      }
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
      if (idleWindow.requestIdleCallback) {
        idleCallback = idleWindow.requestIdleCallback(prewarmInactiveRenderer, {
          timeout: 4000,
        });
      } else {
        fallbackTimer = window.setTimeout(prewarmInactiveRenderer, 1000);
      }
    };
    const handleVisibility = () => {
      if (delayElapsed && !document.hidden) queuePrewarm();
    };
    const delayTimer = window.setTimeout(() => {
      delayElapsed = true;
      queuePrewarm();
    }, 1500);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearTimeout(delayTimer);
      if (idleCallback !== undefined && idleWindow.cancelIdleCallback) {
        idleWindow.cancelIdleCallback(idleCallback);
      }
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
    };
  }, [hasFirstPaint, hasRevealed, isLightModeActive]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add('portfolio-mounted');
    restoreScrollPosition(initialScrollTarget);
    let saveTimer = 0;
    const save = () => {
      window.clearTimeout(saveTimer);
      saveTimer = 0;
      saveScrollPosition();
    };
    const handleScroll = () => {
      if (root.classList.contains('portfolio-booting')) return;
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(save, 120);
    };
    const fallbackTimer = window.setTimeout(() => {
      if (!root.classList.contains('portfolio-booting')) return;
      restoreScrollPosition(initialScrollTarget);
      root.classList.remove('portfolio-booting');
      setHasRevealed(true);
    }, 1500);
    window.addEventListener('pagehide', save);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.clearTimeout(fallbackTimer);
      window.clearTimeout(saveTimer);
      window.removeEventListener('pagehide', save);
      window.removeEventListener('scroll', handleScroll);
      root.classList.remove('portfolio-mounted');
    };
  }, [initialScrollTarget]);

  useEffect(() => {
    if (!hasFirstPaint) return;
    const root = document.documentElement;
    let cancelled = false;
    let finished = false;
    let frame = 0;
    const reveal = () => {
      if (cancelled || finished) return;
      finished = true;
      window.clearTimeout(fontTimer);
      frame = window.requestAnimationFrame(() => {
        if (cancelled) return;
        restoreScrollPosition(initialScrollTarget);
        root.classList.remove('portfolio-booting');
        setHasRevealed(true);
      });
    };
    const fontTimer = window.setTimeout(reveal, 280);
    document.fonts.ready.then(reveal, reveal);
    return () => {
      cancelled = true;
      window.clearTimeout(fontTimer);
      window.cancelAnimationFrame(frame);
    };
  }, [hasFirstPaint, initialScrollTarget]);

  useEffect(() => {
    if (!hasRevealed || document.documentElement.dataset.portfolioReload !== 'true') return;
    const restoreNativeScroll = () => {
      window.history.scrollRestoration = 'auto';
    };
    if (document.readyState === 'complete') restoreNativeScroll();
    else window.addEventListener('load', restoreNativeScroll, { once: true });
    return () => window.removeEventListener('load', restoreNativeScroll);
  }, [hasRevealed]);

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
  const handleThemeToggle = () => {
    if (!LIGHT_MODE_AVAILABLE) return;
    setIsDarkMode((current) => !current);
  };

  return (
    <div
      className={`portfolio-shell ${isInterfaceHidden ? 'is-interface-hidden' : ''}`}
      style={shellStyle}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {isLightModeActive ? (
        <RenderLightMode
          activeColor={activeTheme.color}
          session={lightRendererSession}
          deviceOrientationSession={deviceOrientationSession}
          onFirstPaint={handleFirstPaint}
        />
      ) : (
        <RenderDarkMode
          activeColor={activeTheme.color}
          session={darkRendererSession}
          deviceOrientationSession={deviceOrientationSession}
          onFirstPaint={handleFirstPaint}
        />
      )}

      <div className="background-ambience-layer" aria-hidden="true">
        <span className="background-ambience-points" />
      </div>

      <div
        className="site-interface"
        aria-hidden={isInterfaceHidden || !hasRevealed}
        inert={isInterfaceHidden || !hasRevealed ? true : undefined}
      >
        <Navbar
          activeSection={activeSection}
          isDarkMode={isDarkModeActive}
          isThemeToggleDisabled={!LIGHT_MODE_AVAILABLE}
          onThemeToggle={handleThemeToggle}
          onHideInterface={() => {
            setIsBackgroundHintVisible(false);
            setIsInterfaceHidden(true);
          }}
        />

        <div className="site-content">
          <main id="main-content" className="site-main content-frame" tabIndex={-1}>
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
