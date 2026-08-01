type SectionHeadingProps = {
  id: string;
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  color: string;
};

export default function SectionHeading({
  id,
  number,
  eyebrow,
  title,
  description,
  color,
}: SectionHeadingProps) {
  return (
    <header className="section-heading">
      <div>
        <p className="section-kicker" style={{ color }}>
          <span aria-hidden="true">{number}</span>
          <span className="section-kicker-line" style={{ backgroundColor: color }} />
          {eyebrow}
        </p>
        <h2 id={id} tabIndex={-1}>{title}</h2>
      </div>
      <p className="section-description">{description}</p>
    </header>
  );
}
