import { ArrowDownRight, Download, MapPin } from 'lucide-react';
import pic from '../assets/pic.jpg';

export default function AboutPage() {
  return (
    <section id="about" className="page-section hero-section" aria-labelledby="about-title">
      <div className="hero-layout">
        <div className="hero-copy">
          <p className="hero-eyebrow">
            <span className="status-dot" aria-hidden="true" />
            Computer Science Student
            <span aria-hidden="true">·</span>
            <span className="hero-location">
              <MapPin aria-hidden="true" /> Cebu, Philippines
            </span>
          </p>

          <h1 id="about-title" tabIndex={-1}>
            <span className="hero-greeting">Hi, I&apos;m Aldrin.</span>
            <span>
              I turn ideas into <span className="accent-text about-accent">working software.</span>
            </span>
          </h1>

          <p className="hero-summary">
            I’m a 3rd-year Computer Science student at Cebu Institute of Technology - University who creates web experiences and end-to-end systems focused on solving real-world problems.
          </p>

          <div className="hero-actions">
            <a href="#projects" className="button button-primary about-button">
              Explore my work
              <ArrowDownRight aria-hidden="true" />
            </a>
            <a className="button button-secondary" href="/SUSE_Resume.pdf" download>
              <Download aria-hidden="true" />
              Download résumé
            </a>
          </div>

          <dl className="hero-metrics" aria-label="Portfolio highlights">
            <div>
              <dt>05</dt>
              <dd>Selected projects</dd>
            </div>
            <div>
              <dt>10+</dt>
              <dd>Languages explored</dd>
            </div>
            <div>
              <dt>Web + systems</dt>
              <dd>End-to-end development</dd>
            </div>
          </dl>
        </div>

        <div className="portrait-stage">
          <div className="portrait-accent-frame" aria-hidden="true" />
          <figure className="portrait-card">
            <img
              src={pic}
              alt="Portrait of Aldrin Suse outdoors"
              width="1532"
              height="1532"
              decoding="async"
              fetchPriority="high"
            />
            <figcaption className="portrait-caption">
              <span>Current focus</span>
              <strong>Full-stack systems &amp; thoughtful interfaces</strong>
            </figcaption>
          </figure>
          <div className="portrait-note" aria-hidden="true">
            <span className="portrait-note-dot" />
            Building, learning, iterating
          </div>
        </div>
      </div>
    </section>
  );
}
