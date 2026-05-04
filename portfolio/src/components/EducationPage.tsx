import cituIcon from '../assets/cit-u-icon.png';
import { FaFacebook, FaGlobe } from 'react-icons/fa';

export default function EducationPage() {
  const education = [
    {
      degree: 'Bachelor of Science in Computer Science',
      school: 'Cebu Institute of Technology - University',
      year: '2023 - 2027 (Currently Ongoing)',
      description: 'Built a strong foundation across core areas of computer science, including programming, data structures, algorithms, databases, and software development, with applied projects in full-stack and system-level programming.',
      icon: cituIcon,
			facebook: 'https://www.facebook.com/CITUniversity',
			website: 'https://cit.edu'
    },
    // {
    //   degree: '[Previous Degree or High School]',
    //   school: '[School Name Placeholder]',
    //   year: '2018 - 2022',
    //   description: 'Relevant academic achievements, honors, or extracurricular activities can be listed here.',
    //   icon: BookOpen
    // }
  ];

  return (
    <section id="education" className="py-24">
      <div className="mb-12">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Education
        </h2>

        <div className="w-20 h-1 bg-[var(--education)] rounded-full"></div>
      </div>

      <div className="max-w-full ">
        <div className="space-y-6">
          {education.map((item, index) => (
            <div 
              key={index}
              className="group flex flex-col md:flex-row w-full gap-6 p-6 rounded-2xl bg-gray-50 dark:bg-zinc-900 border-5 border-gray-200 dark:border-zinc-800 hover:border-[var(--education)] dark:hover:border-[var(--education)] transition-all duration-300"
            >
              {/* Icon Wrapper */}
              <div className="flex-shrink-0">
                {/* Added a slight rotate (-rotate-3) on hover for a nice dynamic feel */}
                <div className="bg-gray-200 dark:bg-zinc-800 border-2 border-gray-300 dark:border-zinc-700 p-4 rounded-xl text-gray-500 dark:text-gray-400 group-hover:text-[var(--education)] dark:group-hover:text-[var(--education)] group-hover:scale-110 transition-all duration-300">
                  <img src={item.icon} alt={`${item.school} logo`} className="w-14 h-14" />
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-2 gap-2">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-[var(--education)] dark:group-hover:text-[var(--education)] transition-colors duration-200">
                    {item.degree}
                  </h3>
                  
                  {/* Year Badge */}
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 transition-colors duration-200 whitespace-nowrap">
                    {item.year}
                  </span>
                </div>
                
                <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {item.school}
                </h4>
                
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {item.description}
                </p>

								<div className='flex justify-end w-full ml-auto mt-4 gap-4'>
									{item.facebook && (
										<a 
											href={item.facebook}
											target="_blank"
											rel="noopener noreferrer"
											className="text-gray-500 dark:text-gray-400 hover:text-[#0866FF] dark:hover:text-[#0866FF] transition-colors duration-200 mt-4 inline-flex items-center"
										>
											<FaFacebook className="w-6 h-6" />
										</a>
									)}

									{item.website && (
										<a 
											href={item.website}
											target="_blank"
											rel="noopener noreferrer"
											className="text-gray-500 dark:text-gray-400 hover:text-[#000000] dark:hover:text-[#FFFFFF] transition-colors duration-200 mt-4 inline-flex items-center"
										>
											<FaGlobe className="w-6 h-6" />
										</a>
									)}
								</div>

              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}