import {
  SiC,
  SiCplusplus,
  SiCss,
  SiDjango,
  SiFigma,
  SiGithub,
  SiHtml5,
  SiJavascript,
  SiKotlin,
  SiMongodb,
  SiMysql,
  SiNodedotjs,
  SiPerl,
  SiPostgresql,
  SiPython,
  SiReact,
  SiSpringboot,
  SiSupabase,
  SiTailwindcss,
} from 'react-icons/si';
import { TbBrandCSharp } from 'react-icons/tb';
import { BsOpenai } from 'react-icons/bs';
import { FaCogs, FaCubes, FaDatabase, FaJava, FaNetworkWired, FaRobot, FaSitemap } from 'react-icons/fa';
import SectionHeading from './SectionHeading';

const skillCategories = [
  {
    title: 'Languages',
    description: 'The foundations I use to reason about systems and solve problems.',
    skills: [
      { name: 'C', icon: SiC, color: 'text-[#1c73ff]' },
      { name: 'C++', icon: SiCplusplus, color: 'text-[#1c73ff]' },
      { name: 'C#', icon: TbBrandCSharp, color: 'text-[#903BA7] dark:text-[#c174d4]' },
      { name: 'Java', icon: FaJava, color: 'text-[#f89820]' },
      { name: 'Kotlin', icon: SiKotlin, color: 'text-[#7F52FF] dark:text-[#a98cff]' },
      { name: 'Python', icon: SiPython, color: 'text-[#3776AB] dark:text-[#63a4d8]' },
      { name: 'Perl', icon: SiPerl, color: 'text-[#39457E] dark:text-[#8297df]' },
      { name: 'HTML', icon: SiHtml5, color: 'text-[#E34F26]' },
      { name: 'CSS', icon: SiCss, color: 'text-[#1572B6] dark:text-[#4da7e8]' },
      { name: 'JavaScript', icon: SiJavascript, color: 'text-[#b89b00] dark:text-[#F7DF1E]' },
    ],
  },
  {
    title: 'Frameworks',
    description: 'Tools for shaping reliable web applications and interfaces.',
    skills: [
      { name: 'React.js', icon: SiReact, color: 'text-[#149ECA] dark:text-[#61DAFB]' },
      { name: 'Node.js', icon: SiNodedotjs, color: 'text-[#339933] dark:text-[#62bd62]' },
      { name: 'Django', icon: SiDjango, color: 'text-[#1c7c54] dark:text-[#44B78B]' },
      { name: 'Spring Boot', icon: SiSpringboot, color: 'text-[#5d9f34] dark:text-[#83c95a]' },
      { name: 'Tailwind CSS', icon: SiTailwindcss, color: 'text-[#089bb5] dark:text-[#38d5ef]' },
    ],
  },
  {
    title: 'Databases',
    description: 'Structured and flexible data layers for application work.',
    skills: [
      { name: 'PostgreSQL', icon: SiPostgresql, color: 'text-[#4169E1] dark:text-[#7f9cff]' },
      { name: 'MySQL', icon: SiMysql, color: 'text-[#00758F] dark:text-[#38abc5]' },
      { name: 'MongoDB', icon: SiMongodb, color: 'text-[#37823a] dark:text-[#62c565]' },
      { name: 'Supabase', icon: SiSupabase, color: 'text-[#218d64] dark:text-[#3ECF8E]' },
    ],
  },
  {
    title: 'Tools & AI',
    description: 'The supporting toolkit behind my design and development workflow.',
    skills: [
      { name: 'Figma', icon: SiFigma, color: 'text-[#F24E1E] dark:text-[#ff8060]' },
      { name: 'Git & GitHub', icon: SiGithub, color: 'text-[var(--text-primary)]' },
      { name: 'OpenAI API', icon: BsOpenai, color: 'text-[var(--text-primary)]' },
      { name: 'Claude API', icon: FaRobot, color: 'text-[#C15F3C] dark:text-[#D97757]' },
    ],
  },
  {
    title: 'Core Concepts',
    description: 'The patterns and principles I carry from one stack to the next.',
    skills: [
      { name: 'CRUD', icon: FaDatabase, color: 'text-[var(--skills-ink)]' },
      { name: 'OOP', icon: FaCubes, color: 'text-[var(--skills-ink)]' },
      { name: 'Data Structures', icon: FaSitemap, color: 'text-[var(--skills-ink)]' },
      { name: 'Algorithms', icon: FaCogs, color: 'text-[var(--skills-ink)]' },
      { name: 'API Design', icon: FaNetworkWired, color: 'text-[var(--skills-ink)]' },
    ],
  },
];

export default function SkillsPage() {
  return (
    <section id="skills" className="page-section" aria-labelledby="skills-title">
      <SectionHeading
        id="skills-title"
        number="03"
        eyebrow="Toolkit"
        title="A broad base, used with intention."
        description="I choose tools around the problem–not the other way around–and stay comfortable moving between low-level logic, data, and interface work."
        color="var(--skills-ink)"
      />

      <div className="skills-grid">
        {skillCategories.map((category, index) => (
          <article key={category.title} className="skill-panel">
            <header className="skill-panel-header">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{category.title}</h3>
                <p>{category.description}</p>
              </div>
            </header>

            <ul className="skill-list">
              {category.skills.map((skill) => (
                <li key={skill.name} className="skill-item">
                  <skill.icon
                    className={`skill-icon ${skill.color}`}
                    aria-hidden="true"
                  />
                  <span>{skill.name}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
