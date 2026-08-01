import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react';
import { FaFacebook } from 'react-icons/fa';
import cituIcon from '../assets/cit-u-icon.png';
import SectionHeading from './SectionHeading';

export default function EducationPage() {
  return (
    <section id="education" className="page-section" aria-labelledby="education-title">
      <SectionHeading
        id="education-title"
        number="05"
        eyebrow="Education"
        title="Where the foundation took shape."
        description="Formal study gives me the theory; projects, collaboration, and experimentation turn it into working knowledge."
        color="var(--education-ink)"
      />

      <article className="education-card">
        <div className="education-school-panel">
          <div className="education-logo">
            <img
              src={cituIcon}
              alt=""
              width="96"
              height="96"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div>
            <p className="education-campus">
              <MapPin aria-hidden="true" /> Cebu City
            </p>
            <p className="education-school">Cebu Institute of Technology — University</p>
          </div>
        </div>

        <div className="education-content">
          <div className="education-status">
            <span className="education-status-dot" aria-hidden="true" />
            Currently ongoing
          </div>

          <h3>Bachelor of Science in Computer Science</h3>

          <p className="education-date">
            <CalendarDays aria-hidden="true" />
            <time>2023 — 2027</time>
          </p>

          <p className="education-description">
            Building a strong foundation in programming, data structures, algorithms, databases,
            and software development, with applied projects across full-stack and system-level work.
          </p>

          <div className="education-links" aria-label="University links">
            <a
              href="https://www.facebook.com/CITUniversity"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit CIT University on Facebook"
            >
              <FaFacebook aria-hidden="true" />
              Facebook
              <ArrowUpRight aria-hidden="true" />
            </a>
            <a
              href="https://cit.edu"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit the CIT University website"
            >
              University website
              <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </article>
    </section>
  );
}
