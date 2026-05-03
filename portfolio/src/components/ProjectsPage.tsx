// src/components/ProjectsPage.tsx
import { Code, ExternalLink } from 'lucide-react';

export default function ProjectsPage() {
  const projects = [
    {
      id: 1,
      title: 'LEXOR',
      description: 'An end-to-end interpreter for a statically-typed language, covering the full pipeline from lexical analysis and parsing to semantic validation and execution, built around core compiler design principles.',
      tags: ['Java', 'Abstract Syntax Tree', 'Interpreter'],
      featured: true,
    },
    {
      id: 2,
      title: 'Ra-Byes!',
      description: 'A Node.js and TypeScript web application focused on rabies education, covering statistics, prevention, and first-aid guidance across multiple informational pages. Includes a geolocation-powered map built with MapLibre that directs users to the nearest rabies treatment center in real time.',
      tags: ['React', 'TypeScript', 'Node.js'],
      featured: true,
    },
    {
      id: 3,
      title: 'AsaNaBus',
      description: 'A bus commuting platform built around a structured database system, designed to streamline trip management and improve the overall commuting experience. Includes user authentication with login validation and secure account data handling.',
      tags: ['React', 'JavaScript', 'Database'],
      featured: false,
    },
    {
      id: 4,
      title: 'FourLink',
      description: 'A single-device two-player mobile game implementing turn-based gameplay logic from scratch. Engineered core systems covering player turn handling, piece collision detection, and victory condition algorithms.',
      tags: ['Kotlin', 'Algorithms', 'Game Design'],
      featured: false,
    },
    {
      id: 5,
      title: 'Aegis Chess',
      description: 'A two-player chess game covering all standard rules and movement types on a single device. Built the underlying logic for move validation, board state tracking, and endgame detection including checkmate and stalemate.',
      tags: ['Java', 'Algorithms', 'Game Development'],
      featured: false,
    },
  ];

  return (
    <section id="projects" className="py-24">
      <div className="mb-12">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Featured Projects
        </h2>
        <div className="w-20 h-1 bg-accent rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project) => (
          <div 
            key={project.id} 
            className={`group relative flex flex-col justify-between p-6 rounded-2xl bg-gray-50 dark:bg-zinc-900 border ${project.featured ? 'border-accent/50 dark:border-accent/50' : 'border-gray-200 dark:border-zinc-800'} hover:border-accent dark:hover:border-accent transition-colors duration-300`}
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold group-hover:text-accent transition-colors duration-200">
                  {project.title}
                </h3>
                <div className="flex space-x-3 text-gray-500 dark:text-gray-400">
                  <a href="#" className="hover:text-black dark:hover:text-white transition-colors">
                    <Code className="w-5 h-5" />
                  </a>
                  <a href="#" className="hover:text-black dark:hover:text-white transition-colors">
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
              
              <p className="text-gray-600 text-justify dark:text-gray-400 text-sm leading-relaxed mb-6">
                {project.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mt-auto">
              {project.tags.map((tag) => (
                <span 
                  key={tag} 
                  className="px-3 py-1 text-xs font-medium rounded-full bg-gray-200 dark:bg-zinc-800 text-gray-800 dark:text-gray-200"
                >
                  {tag}
                </span>
              ))}
            </div>
            
            {project.featured && (
              <div className="absolute -top-3 -right-3 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                Featured
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}