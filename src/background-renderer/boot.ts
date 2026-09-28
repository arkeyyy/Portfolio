import { isSectionId, sections } from '../sectionTheme';
import type { SectionId } from '../sectionTheme';

const SCROLL_STORAGE_KEY = 'aldrin-portfolio-scroll-v1';

type SavedScroll = {
  version: 1;
  url: string;
  section: SectionId;
  offset: number;
  y: number;
};

export type InitialScrollTarget = {
  section: SectionId;
  saved: SavedScroll | null;
  hash: SectionId | null;
};

function currentUrl() {
  return window.location.pathname + window.location.search + window.location.hash;
}

function isReload() {
  return performance.getEntriesByType('navigation').some((entry) =>
    (entry as PerformanceNavigationTiming).type === 'reload');
}

export function getInitialScrollTarget(): InitialScrollTarget {
  let hash = window.location.hash.slice(1);
  try { hash = decodeURIComponent(hash); } catch { /* Keep the raw fragment. */ }
  const sectionHash = isSectionId(hash) ? hash : null;
  if (isReload()) {
    try {
      const value = JSON.parse(window.sessionStorage.getItem(SCROLL_STORAGE_KEY) || 'null');
      if (value?.version === 1 && value.url === currentUrl()
        && isSectionId(value.section) && Number.isFinite(value.offset)
        && Number.isFinite(value.y) && value.y >= 0) {
        return { section: value.section, saved: value as SavedScroll, hash: sectionHash };
      }
    } catch {
      // Private browsing or disabled storage still allows hash navigation.
    }
  }
  return { section: sectionHash ?? 'about', saved: null, hash: sectionHash };
}

export function saveScrollPosition() {
  try {
    const marker = window.scrollY + Math.min(window.innerHeight * 0.32, 320);
    let section: SectionId = 'about';
    for (const candidate of sections) {
      const element = document.getElementById(candidate.id);
      if (element && element.getBoundingClientRect().top + window.scrollY <= marker) {
        section = candidate.id;
      }
    }
    const element = document.getElementById(section);
    const top = element ? element.getBoundingClientRect().top + window.scrollY : 0;
    const saved: SavedScroll = {
      version: 1,
      url: currentUrl(),
      section,
      offset: window.scrollY - top,
      y: window.scrollY,
    };
    window.sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // Scroll restoration remains usable through URL hashes without storage.
  }
}

export function restoreScrollPosition(target: InitialScrollTarget) {
  if (target.saved) {
    const element = document.getElementById(target.saved.section);
    const top = element
      ? element.getBoundingClientRect().top + window.scrollY + target.saved.offset
      : target.saved.y;
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo(0, Math.min(Math.max(0, top), maxY));
  } else if (target.hash) {
    document.getElementById(target.hash)?.scrollIntoView({ block: 'start' });
  }
}
