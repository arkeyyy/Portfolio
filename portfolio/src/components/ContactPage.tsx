// src/components/ContactPage.tsx
import { Mail, Phone } from 'lucide-react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';

export default function ContactPage() {
  const contactMethods = [
    {
      name: 'Email',
      value: 'susealdrin15@gmail.com',
      link: 'mailto:susealdrin15@gmail.com',
      icon: Mail,
      isExternal: false,
      hover: 'var(--about)'
    },
    {
      name: 'Phone',
      value: '+63 912 345 6789', // Replace with your actual number
      link: 'tel:+639123456789',
      icon: Phone,
      isExternal: false,
      hover: 'var(--skills)'
    },
    {
      name: 'GitHub',
      value: 'github.com/yourusername', // Replace with your username
      link: 'https://github.com/',
      icon: FaGithub,
      isExternal: true,
      hover: 'var(--white)'
    },
    {
      name: 'LinkedIn',
      value: 'linkedin.com/in/yourusername', // Replace with your username
      link: 'https://linkedin.com/in/',
      icon: FaLinkedin,
      isExternal: true,
      hover: 'var(--linkedin)'
    }
  ];

  return (
    <section id="contact" className="py-24">
      <div className="mb-12">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Contact
        </h2>
        <div className="w-60 h-1 bg-[var(--contact)] rounded-full"></div>
      </div>

      <div>
        {/* The Master Card */}
        <div className="bg-gray-50 w-full dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-8 md:p-12 shadow-sm">
          
          {/* Upper Part: Title & Description */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h3 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Let's Connect
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              I'm always open to discussing new projects, creative ideas, or opportunities to be a part of your visions. Feel free to reach out through any of the platforms below!
            </p>
          </div>

          {/* Lower Part: Mini Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => (
              <a
                key={index}
                href={method.link}
                target={method.isExternal ? "_blank" : "_self"}
                rel={method.isExternal ? "noopener noreferrer" : ""}
                className="group flex flex-col items-center p-6 bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 hover:border-[var(--contact)] dark:hover:border-[var(--contact)] hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                {/* Icon Bubble */}
                <div className={`bg-gray-100 dark:bg-zinc-900 p-4 rounded-full text-gray-500 dark:text-gray-400 group-hover:text-[${method.hover}] dark:group-hover:text-[${method.hover}] transition-colors duration-200 mb-4`}>
                  <method.icon className="w-7 h-7" />
                </div>
                
                {/* Text Content */}
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[var(--contact)] dark:group-hover:text-[var(--contact)] transition-colors duration-200 mb-1">
                  {method.name}
                </h4>
                <span className="text-sm text-gray-500 dark:text-gray-400 text-center break-all">
                  {method.value}
                </span>
              </a>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}