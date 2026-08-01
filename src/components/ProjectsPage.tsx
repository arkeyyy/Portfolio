import { ArrowUpRight, Code2 } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import SectionHeading from './SectionHeading';

const projects = [
  {
    id: 1,
    title: 'LEXOR',
    category: 'Language tooling',
    description:
      'An end-to-end interpreter for a statically typed language, covering the full pipeline from lexical analysis and parsing to semantic validation and execution.',
    tags: ['Java', 'Abstract Syntax Tree', 'Interpreter'],
    featured: true,
    githubUrl: 'https://github.com/arkeyyy/LEXOR_Project.git',
    liveUrl: '',
  },
  {
    id: 2,
    title: 'Ra-Byes!',
    category: 'Public health platform',
    description:
      'A web application for rabies education and first-aid guidance, with a geolocation-powered MapLibre experience that directs users to nearby treatment centers.',
    tags: ['React', 'TypeScript', 'Node.js'],
    featured: true,
    githubUrl: 'https://github.com/Naweeeeeh/rabye.git',
    liveUrl: 'https://rabye.onrender.com',
  },
  {
    id: 3,
    title: 'AsaNaBus',
    category: 'Mobility platform',
    description:
      'A bus commuting platform built around a structured database system, user authentication, and secure account handling to simplify trip management.',
    tags: ['React', 'JavaScript', 'Database'],
    featured: false,
    githubUrl: 'https://github.com/Naweeeeeh/asanabus.git',
    liveUrl: '',
  },
  {
    id: 4,
    title: 'FourLink',
    category: 'Mobile game',
    description:
      'A single-device, two-player game with custom turn handling, piece collision detection, and victory-condition algorithms.',
    tags: ['Kotlin', 'Algorithms', 'Game Design'],
    featured: false,
    githubUrl: 'https://github.com/arkeyyy/FourLink.git',
    liveUrl: '',
  },
  {
    id: 5,
    title: 'Aegis Chess',
    category: 'Game logic',
    description:
      'A complete two-player chess implementation with move validation, board-state tracking, checkmate detection, and stalemate handling.',
    tags: ['Java', 'Algorithms', 'Game Development'],
    featured: false,
    githubUrl: 'https://github.com/arkeyyy/Aegis-Chess.git',
    liveUrl: '',
  },
];

export default function ProjectsPage() {
  return (
    <section id="projects" className="page-section" aria-labelledby="projects-title">
      <SectionHeading
        id="projects-title"
        number="02"
        eyebrow="Selected work"
        title="Projects with a purpose."
        description="A selection of systems, tools, and experiences that pushed me to think across product, interface, and implementation."
        color="var(--projects-ink)"
      />

      <div className="projects-grid">
        {projects.map((project) => (
          <article
            key={project.id}
            className={`project-card ${project.featured ? 'project-card-featured' : ''}`}
          >
            <div className="project-card-glow" aria-hidden="true" />

            <div className="project-card-topline">
              <span className="project-index">{String(project.id).padStart(2, '0')}</span>
              {project.featured && <span className="featured-label">Featured build</span>}
            </div>

            <div className="project-symbol" aria-hidden="true">
              <Code2 />
            </div>

            <div className="project-content">
              <p className="project-category">{project.category}</p>
              <h3>{project.title}</h3>
              <p className="project-description">{project.description}</p>

              <ul className="tech-list" aria-label={`${project.title} technologies`}>
                {project.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </div>

            <div className="project-actions">
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="project-link"
                aria-label={`View ${project.title} source code on GitHub`}
              >
                <FaGithub aria-hidden="true" />
                Source
              </a>

              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project-link project-link-primary"
                  aria-label={`Open the live ${project.title} project`}
                >
                  Live demo
                  <ArrowUpRight aria-hidden="true" />
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
