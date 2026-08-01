import { Award } from 'lucide-react';
import codechumIcon from '../assets/codechum-icon.png';
import sololearnIcon from '../assets/sololearn-icon.png';
import canvaIcon from '../assets/canva-icon.png';
import SectionHeading from './SectionHeading';

const certifications = [
  {
    title: 'C Programming Certification',
    issuer: 'CodeChum',
    year: '2024',
    icon: codechumIcon,
  },
  {
    title: 'Java Object-Oriented Programming Certification Exam',
    issuer: 'CIT-U · CodeChum',
    year: '2025',
    icon: codechumIcon,
  },
  {
    title: 'Introduction to Python Course Certificate',
    issuer: 'Sololearn',
    year: '2025',
    icon: sololearnIcon,
  },
  {
    title: 'Design School Certificate',
    issuer: 'Canva',
    year: '2024',
    icon: canvaIcon,
  },
];

export default function CertificationsPage() {
  return (
    <section id="certifications" className="page-section" aria-labelledby="certifications-title">
      <SectionHeading
        id="certifications-title"
        eyebrow="Credentials"
        title="Learning, made tangible."
        description="Coursework and assessments that sharpened my technical foundation and expanded the way I approach making things."
        color="var(--certifications-ink)"
      />

      <div className="credentials-grid">
        {certifications.map((certification, index) => (
          <article key={certification.title} className="credential-card">
            <div className="credential-logo">
              <img
                src={certification.icon}
                alt=""
                width="48"
                height="48"
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="credential-content">
              <div className="credential-meta">
                <span>{certification.issuer}</span>
                <span aria-hidden="true">·</span>
                <time>{certification.year}</time>
              </div>
              <h3>{certification.title}</h3>
            </div>

            <div className="credential-mark" aria-hidden="true">
              <Award aria-hidden="true" />
              <span>{String(index + 1).padStart(2, '0')}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
