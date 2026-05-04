import { Code, ExternalLink } from 'lucide-react';

const tagColors: Record<string, string> = {
  'TypeScript': 'bg-blue-100 text-blue-700 border-2 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30',
  'React': 'bg-cyan-100 text-cyan-700 border-2 border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30',
  'Node.js': 'bg-green-100 text-green-700 border-2 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30',
  'Full-Stack': 'bg-purple-100 text-purple-700 border-2 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30',
  'Kotlin': 'bg-purple-100 text-purple-700 border-2 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30',
  'Algorithms': 'bg-yellow-100 text-yellow-700 border-2 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30',
  'Java': 'bg-red-100 text-red-700 border-2 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30',
  'Database': 'bg-gray-100 text-gray-700 border-2 border-gray-200 dark:bg-zinc-500/20 dark:text-gray-300 dark:border-zinc-500/30',
  'Abstract Syntax Tree': 'bg-teal-100 text-teal-700 border-2 border-teal-200 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30',
  'Interpreter': 'bg-indigo-100 text-indigo-700 border-2 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30',
  'JavaScript': 'bg-yellow-100 text-yellow-700 border-2 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30',
  'Game Development': 'bg-orange-100 text-orange-700 border-2 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30',
	'Game Design': 'bg-orange-100 text-orange-700 border-2 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30',
};

export default function ProjectsPage() {
  const projects = [
    {
      id: 1,
      title: 'LEXOR',
      description: 'An end-to-end interpreter for a statically-typed language, covering the full pipeline from lexical analysis and parsing to semantic validation and execution, built around core compiler design principles.',
      tags: ['Java', 'Abstract Syntax Tree', 'Interpreter'],
      featured: true,
			githubUrl: 'https://github.com/arkeyyy/LEXOR_Project.git',
      liveUrl: '',
    },
    {
      id: 2,
      title: 'Ra-Byes!',
      description: 'A Node.js and TypeScript web application focused on rabies education, covering statistics, prevention, and first-aid guidance across multiple informational pages. Includes a geolocation-powered map built with MapLibre that directs users to the nearest rabies treatment center in real time.',
      tags: ['React', 'TypeScript', 'Node.js'],
      featured: true,
			githubUrl: 'https://github.com/Naweeeeeh/rabye.git',
      liveUrl: 'https://rabye.onrender.com',
    },
    {
      id: 3,
      title: 'AsaNaBus',
      description: 'A bus commuting platform built around a structured database system, designed to streamline trip management and improve the overall commuting experience. Includes user authentication with login validation and secure account data handling.',
      tags: ['React', 'JavaScript', 'Database'],
      featured: false,
			githubUrl: 'https://github.com/Naweeeeeh/asanabus.git',
      liveUrl: '',
    },
    {
      id: 4,
      title: 'FourLink',
      description: 'A single-device two-player mobile game implementing turn-based gameplay logic from scratch. Engineered core systems covering player turn handling, piece collision detection, and victory condition algorithms.',
      tags: ['Kotlin', 'Algorithms', 'Game Design'],
      featured: false,
			githubUrl: 'https://github.com/arkeyyy/FourLink.git',
      liveUrl: '',
    },
    {
      id: 5,
      title: 'Aegis Chess',
      description: 'A two-player chess game covering all standard rules and movement types on a single device. Built the underlying logic for move validation, board state tracking, and endgame detection including checkmate and stalemate.',
      tags: ['Java', 'Algorithms', 'Game Development'],
      featured: false,
			githubUrl: 'https://github.com/arkeyyy/Aegis-Chess.git',
      liveUrl: '',
    },
  ];

  return (
    <section id="projects" className="py-24">
      <div className="mb-12">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Featured Projects
        </h2>
        <div className="w-20 h-1 bg-[var(--projects)] rounded-full"></div>   {/* line ubos sa Featured Projects */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project) => (
          <div 
            key={project.id} 
            className={`group relative flex flex-col justify-between p-6 rounded-2xl bg-gray-50 dark:bg-[#1f1f21] border ${project.featured ? 'border-[var(--projects)]/50 dark:border-[var(--projects)]/50 border-2' : 'border-gray-200 dark:border-zinc-800'} hover:border-[var(--projects)] dark:hover:border-[var(--projects)] transition-colors duration-300`}
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold group-hover:text-[var(--projects)] transition-colors duration-200">
                  {project.title}
                </h3>
                <div className="flex space-x-3 text-gray-500 dark:text-gray-400">
									{/* Render only kung nay githubUrl */}
                  {project.githubUrl && (
										<a 
											href={project.githubUrl} 
											target="_blank" 
											rel="noopener noreferrer" 
											className="hover:text-black dark:hover:text-white transition-colors"
										>
											<Code className="w-5 h-5" />
										</a>
									)}

									{/* Render only kung nay liveUrl */}
									{project.liveUrl && (
										<a 
											href={project.liveUrl} 
											target="_blank" 
											rel="noopener noreferrer" 
											className="hover:text-black dark:hover:text-white transition-colors"
										>
											<ExternalLink className="w-5 h-5" />
										</a>
									)}
                </div>
              </div>
              
              <p className="text-gray-600 text-justify dark:text-gray-400 text-sm leading-relaxed mb-6">
                {project.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mt-auto">
              {project.tags.map((tag) => {
								const colorClass = tagColors[tag] || 'bg-gray-200 text-gray-800 border border-gray-300 dark:bg-zinc-800 dark:text-gray-200 dark:border-zinc-700';
									return (
										
										<span 
											key={tag} 
											className={`px-3 py-1 text-xs font-medium rounded-full ${colorClass}`}
										>
											{tag}
										</span>
									);
							})}
            </div>
            
            {project.featured && (
              <div className="absolute -top-3 -right-3 bg-[var(--projects)] text-black text-[12px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                Featured
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}