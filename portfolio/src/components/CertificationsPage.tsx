// src/components/CertificationsPage.tsx
import { Award } from 'lucide-react';

export default function CertificationsPage() {
  const certifications = [
    { 
      title: 'CodeChum C Programming Certification', 
      issuer: 'CodeChum', 
      year: '2024' 
    },
    { 
      title: 'CITU – Java Object-Oriented Programming Certification Exam', 
      issuer: 'CodeChum', 
      year: '2025' 
    },
    { 
      title: 'Sololearn Introduction to Python Course Certificate', 
      issuer: 'Sololearn', 
      year: '2025' 
    },
    { 
      title: 'Canva Design School Certificate', 
      issuer: 'Canva', 
      year: '2024' 
    },
  ];

  return (
    <section id="certifications" className="py-24">
      <div className="mb-12">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Certifications
        </h2>
        <div className="w-20 h-1 bg-[var(--certifications)] rounded-full"></div>
      </div>

      {/* Full width container with 2-column layout */}
      <div>
        
        {/* Flex parent container with wrapping enabled */}
        <div className="flex flex-col md:flex-row md:flex-wrap -mx-4 gap-y-4">
          
          {certifications.map((cert, index) => (
            // Flex child: 100% width on mobile, 50% width on md screens and up
            <div key={index} className="w-full md:w-1/2 px-4">
              
              <div className="group flex items-start space-x-4 p-4 rounded-xl border-2 hover:border-[var(--certifications)] bg-white hover:bg-[#ededed] dark:bg-zinc-800 dark:hover:bg-zinc-900 transition-colors duration-200 h-full">
                <div className="mt-1 flex-shrink-0 bg-gray-200 dark:bg-zinc-700 p-2 rounded-full text-gray-500 dark:text-gray-400 dark:group-hover:text-[var(--certifications)] group-hover:text-[var(--certifications)] group-hover:scale-110 group-hover:bg-gray-300 dark:group-hover:bg-zinc-600 transition-all duration-300">
                  <Award className="w-5 h-5" />
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-black dark:text-gray-100 dark:group-hover:text-[var(--certifications)] group-hover:text-[var(--certifications)] transition-colors duration-200">
                    {cert.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">
                    {cert.issuer} <span className="mx-2 text-gray-600 dark:text-zinc-600">—</span> {cert.year}
                  </p>
                </div>
              </div>
              
            </div>
          ))}
          
        </div>
      </div>
    </section>
  );
}