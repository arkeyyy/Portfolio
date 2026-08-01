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
    className: 'skill-panel-wide',
    skills: [
      { name: 'C', icon: SiC, hoverColor: 'group-hover:text-[#1c73ff]' },
      { name: 'C++', icon: SiCplusplus, hoverColor: 'group-hover:text-[#1c73ff]' },
      { name: 'C#', icon: TbBrandCSharp, hoverColor: 'group-hover:text-[#903BA7]' },
      { name: 'Java', icon: FaJava, hoverColor: 'group-hover:text-[#f89820]' },
      { name: 'Kotlin', icon: SiKotlin, hoverColor: 'group-hover:text-[#7F52FF]' },
      { name: 'Python', icon: SiPython, hoverColor: 'group-hover:text-[#3776AB]' },
      { name: 'Perl', icon: SiPerl, hoverColor: 'group-hover:text-[#39457E]' },
      { name: 'HTML', icon: SiHtml5, hoverColor: 'group-hover:text-[#E34F26]' },
      { name: 'CSS', icon: SiCss, hoverColor: 'group-hover:text-[#1572B6]' },
      { name: 'JavaScript', icon: SiJavascript, hoverColor: 'group-hover:text-[#d6b900]' },
    ],
  },
  {
    title: 'Frameworks',
    description: 'Tools for shaping reliable web applications and interfaces.',
    className: '',
    skills: [
      { name: 'React.js', icon: SiReact, hoverColor: 'group-hover:text-[#149ECA]' },
      { name: 'Node.js', icon: SiNodedotjs, hoverColor: 'group-hover:text-[#339933]' },
      { name: 'Django', icon: SiDjango, hoverColor: 'group-hover:text-[#1c7c54]' },
      { name: 'Spring Boot', icon: SiSpringboot, hoverColor: 'group-hover:text-[#6DB33F]' },
      { name: 'Tailwind CSS', icon: SiTailwindcss, hoverColor: 'group-hover:text-[#06B6D4]' },
    ],
  },
  {
    title: 'Databases',
    description: 'Structured and flexible data layers for application work.',
    className: '',
    skills: [
      { name: 'PostgreSQL', icon: SiPostgresql, hoverColor: 'group-hover:text-[#4169E1]' },
      { name: 'MySQL', icon: SiMysql, hoverColor: 'group-hover:text-[#00758F]' },
      { name: 'MongoDB', icon: SiMongodb, hoverColor: 'group-hover:text-[#47A248]' },
      { name: 'Supabase', icon: SiSupabase, hoverColor: 'group-hover:text-[#3ECF8E]' },
    ],
  },
  {
    title: 'Tools & AI',
    description: 'The supporting toolkit behind my design and development workflow.',
    className: '',
    skills: [
      { name: 'Figma', icon: SiFigma, hoverColor: 'group-hover:text-[#F24E1E]' },
      { name: 'Git & GitHub', icon: SiGithub, hoverColor: 'group-hover:text-[var(--text-primary)]' },
      { name: 'OpenAI API', icon: BsOpenai, hoverColor: 'group-hover:text-[var(--text-primary)]' },
      { name: 'Claude API', icon: FaRobot, hoverColor: 'group-hover:text-[#D97757]' },
    ],
  },
  {
    title: 'Core Concepts',
    description: 'The patterns and principles I carry from one stack to the next.',
    className: 'skill-panel-wide',
    skills: [
      { name: 'CRUD', icon: FaDatabase, hoverColor: 'group-hover:text-[var(--skills)]' },
      { name: 'OOP', icon: FaCubes, hoverColor: 'group-hover:text-[var(--skills)]' },
      { name: 'Data Structures', icon: FaSitemap, hoverColor: 'group-hover:text-[var(--skills)]' },
      { name: 'Algorithms', icon: FaCogs, hoverColor: 'group-hover:text-[var(--skills)]' },
      { name: 'API Design', icon: FaNetworkWired, hoverColor: 'group-hover:text-[var(--skills)]' },
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
        description="I choose tools around the problem—not the other way around—and stay comfortable moving between low-level logic, data, and interface work."
        color="var(--skills-ink)"
      />

      <div className="skills-grid">
        {skillCategories.map((category, index) => (
          <article key={category.title} className={`skill-panel ${category.className}`}>
            <header className="skill-panel-header">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{category.title}</h3>
                <p>{category.description}</p>
              </div>
            </header>

            <ul className="skill-list">
              {category.skills.map((skill) => (
                <li key={skill.name} className="skill-item group">
                  <skill.icon
                    className={`skill-icon ${skill.hoverColor}`}
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
