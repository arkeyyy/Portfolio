import type { CSSProperties } from 'react';

type SectionHeadingProps = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  color: string;
};

export default function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  color,
}: SectionHeadingProps) {
  const headingStyle = { '--section-heading-accent': color } as CSSProperties;

  return (
    <header className="section-heading" style={headingStyle}>
      <div>
        <p className="section-kicker" style={{ color }}>
          {eyebrow}
        </p>
        <h2 id={id} tabIndex={-1}>{title}</h2>
      </div>
      <p className="section-description">{description}</p>
    </header>
  );
}
