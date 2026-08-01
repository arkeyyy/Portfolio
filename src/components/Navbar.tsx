import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { sectionById, sections } from '../sectionTheme';
import type { SectionId } from '../sectionTheme';

const THEME_STORAGE_KEY = 'aldrin-portfolio-theme';

function getInitialTheme() {
  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'dark') return true;
    if (savedTheme === 'light') return false;
  } catch {
    // Storage can be unavailable in hardened/private browser contexts.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export default function Navbar({ activeSection }: { activeSection: SectionId }) {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const activeTheme = sectionById[activeSection];
  const activeIndex = sections.findIndex((section) => section.id === activeSection);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDarkMode);
    root.style.colorScheme = isDarkMode ? 'dark' : 'light';
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', isDarkMode ? '#0b0c0f' : '#f5f6f7');
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? 'dark' : 'light');
    } catch {
      // Theme still works for the current visit when storage is unavailable.
    }
  }, [isDarkMode]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
        window.requestAnimationFrame(() => menuButtonRef.current?.focus());
      }
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isMenuOpen]);

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 1061px)');
    const closeAtDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setIsMenuOpen(false);
    };

    desktopQuery.addEventListener('change', closeAtDesktop);
    return () => desktopQuery.removeEventListener('change', closeAtDesktop);
  }, []);

  const closeMobileMenu = (destination: SectionId) => {
    setIsMenuOpen(false);
    window.requestAnimationFrame(() => {
      document
        .getElementById(`${destination}-title`)
        ?.focus({ preventScroll: true });
    });
  };

  return (
    <nav className="site-nav" aria-label="Primary navigation">
      <div className="nav-frame">
        <div className="nav-bar">
          <a
            href="#about"
            className="brand-button"
            aria-label="Go to the About section"
          >
            <span
              className="brand-mark"
              style={{ backgroundColor: activeTheme.color, color: activeTheme.contrast }}
              aria-hidden="true"
            >
              A
            </span>
            <span className="brand-name">
              Aldrin <span style={{ color: activeTheme.ink }}>S.</span>
            </span>
          </a>

          <div className="desktop-nav" aria-label="Portfolio sections">
            {sections.map((section) => {
              const isActive = activeSection === section.id;
              const itemStyle = {
                '--item-color': section.color,
                '--item-ink': section.ink,
              } as CSSProperties;

              return (
                <a
                  href={`#${section.id}`}
                  key={section.id}
                  className={`nav-item ${isActive ? 'is-active' : ''}`}
                  style={itemStyle}
                  aria-current={isActive ? 'location' : undefined}
                >
                  {section.label}
                </a>
              );
            })}
          </div>

          <div className="nav-actions">
            <button
              type="button"
              onClick={() => setIsDarkMode((current) => !current)}
              className="icon-button"
              style={{ color: activeTheme.ink }}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            </button>

            <button
              type="button"
              ref={menuButtonRef}
              className="icon-button mobile-menu-button"
              onClick={() => setIsMenuOpen((current) => !current)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className="nav-progress" aria-hidden="true">
          <span
            style={{
              width: `${((activeIndex + 1) / sections.length) * 100}%`,
              backgroundColor: activeTheme.color,
            }}
          />
        </div>

        <div
          id="mobile-navigation"
          className={`mobile-nav ${isMenuOpen ? 'is-open' : ''}`}
          aria-hidden={!isMenuOpen}
        >
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <a
                href={`#${section.id}`}
                key={section.id}
                onClick={() => closeMobileMenu(section.id)}
                className={`mobile-nav-item ${isActive ? 'is-active' : ''}`}
                style={isActive ? { color: section.ink } : undefined}
                tabIndex={isMenuOpen ? 0 : -1}
                aria-current={isActive ? 'location' : undefined}
              >
                <span>{section.label}</span>
                <span className="mobile-nav-number">{section.number}</span>
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
