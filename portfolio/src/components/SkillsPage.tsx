import { 
  SiC, SiCplusplus, SiKotlin, SiPython, SiPerl, 
  SiHtml5, SiCss, SiJavascript, SiReact, SiNodedotjs, SiDjango, 
  SiSpringboot, SiTailwindcss, SiPostgresql, SiMongodb, SiSupabase, 
  SiMysql, SiFigma, SiGithub, SiOpenai 
} from 'react-icons/si';

import { TbBrandCSharp } from "react-icons/tb";

import { 
  FaJava, FaRobot, FaDatabase, FaCubes, FaSitemap, FaCogs, FaNetworkWired 
} from 'react-icons/fa';

export default function SkillsPage() {
  const skillCategories = [
    {
      title: 'Languages',
      skills: [
        { name: 'C', icon: SiC, hoverColor: 'group-hover:text-[#1c73ff]' },
        { name: 'C++', icon: SiCplusplus, hoverColor: 'group-hover:text-[#1c73ff]' },
        { name: 'C#', icon: TbBrandCSharp, hoverColor: 'group-hover:text-[#903BA7]' },
        { name: 'Java', icon: FaJava, hoverColor: 'group-hover:text-[#f89820]' },
        { name: 'Kotlin', icon: SiKotlin, hoverColor: 'group-hover:text-[#7F52FF]' },
        { name: 'Python', icon: SiPython, hoverColor: 'group-hover:text-[#1c73ff]' },
        { name: 'Perl', icon: SiPerl, hoverColor: 'group-hover:text-[#1c73ff]' },
        { name: 'HTML', icon: SiHtml5, hoverColor: 'group-hover:text-[#E34F26]' },
        { name: 'CSS', icon: SiCss, hoverColor: 'group-hover:text-[#1c73ff]' },
        { name: 'JavaScript', icon: SiJavascript, hoverColor: 'group-hover:text-[#F7DF1E]' },
      ]
    },
    {
      title: 'Frameworks',
      skills: [
        { name: 'React.js', icon: SiReact, hoverColor: 'group-hover:text-[#61DAFB]' },
        { name: 'Node.js', icon: SiNodedotjs, hoverColor: 'group-hover:text-[#339933]' },
        { name: 'Django', icon: SiDjango, hoverColor: 'group-hover:text-[#092E20] dark:group-hover:text-[#44B78B]' },
        { name: 'Spring Boot', icon: SiSpringboot, hoverColor: 'group-hover:text-[#6DB33F]' },
        { name: 'Tailwind', icon: SiTailwindcss, hoverColor: 'group-hover:text-[#06B6D4]' },
      ]
    },
    {
      title: 'Databases',
      skills: [
        { name: 'PostgreSQL', icon: SiPostgresql, hoverColor: 'group-hover:text-[#4169E1]' },
        { name: 'MongoDB', icon: SiMongodb, hoverColor: 'group-hover:text-[#47A248]' },
        { name: 'Supabase', icon: SiSupabase, hoverColor: 'group-hover:text-[#3ECF8E]' },
      ]
    },
    {
      title: 'Tools & AI',
      skills: [
        { name: 'MySQL', icon: SiMysql, hoverColor: 'group-hover:text-[#1c73ff]' },
        { name: 'Figma', icon: SiFigma, hoverColor: 'group-hover:text-[#F24E1E]' },
        { name: 'Git/GitHub', icon: SiGithub, hoverColor: 'group-hover:text-black dark:group-hover:text-white' },
        { name: 'OpenAI API', icon: SiOpenai, hoverColor: 'group-hover:text-black dark:group-hover:text-white' },
        { name: 'Claude API', icon: FaRobot, hoverColor: 'group-hover:text-[#D97757]' }, // Anthropic peach/orange
      ]
    },
    {
      title: 'Core Concepts',
      skills: [
        { name: 'CRUD', icon: FaDatabase, hoverColor: 'group-hover:text-[#1c73ff]' },
        { name: 'OOP', icon: FaCubes, hoverColor: 'group-hover:text-[#ffb700]' },
        { name: 'Data Structures', icon: FaSitemap, hoverColor: 'group-hover:text-[#82b2ff]' },
        { name: 'Algorithms', icon: FaCogs, hoverColor: 'group-hover:text-black dark:group-hover:text-white' },
        { name: 'API', icon: FaNetworkWired, hoverColor: 'group-hover:text-[#a182fa]' },
      ]
    }
  ];

  return (
    <section id="skills" className="py-24">
      <div className="mb-16">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Skills
        </h2>
        <div className="w-60 h-1 bg-[var(--skills)] rounded-full"></div>
      </div>

      <div className="space-y-16">
        {skillCategories.map((category) => (
          <div key={category.title}>

            <div className="flex items-center space-x-4 mb-6 w-full">
							{/* Left line (Fixed width) */}
							<div className="flex-1 h-0.5 bg-[var(--skills)] rounded-full"></div>
							
							{/* The Title */}
							<h3 className="text-2xl font-semibold text-black dark:text-white tracking-tight whitespace-nowrap">
								{category.title}
							</h3>
							
							{/* Right line (Flexible width, fills remaining space) */}
							<div className="flex-1 h-0.5 bg-[var(--skills)] rounded-full"></div>
						</div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {category.skills.map((skill) => (
                <div 
                  key={skill.name} 
                  className="group flex flex-col border-3 items-center justify-center p-6 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-500 dark:border-zinc-500 hover:border-[var(--skills)] dark:hover:border-[var(--skills)] transition-all duration-300 hover:-translate-y-1"
                >
                  <skill.icon 
                    className={`w-10 h-10 mb-4 text-gray-500 transition-colors duration-300 ${skill.hoverColor}`} 
                  />
                  <span className="text-sm font-medium text-center text-gray-700 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors duration-300">
                    {skill.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}