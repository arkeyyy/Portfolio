// src/components/Footer.tsx
import { ArrowUp } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 bg-white dark:bg-black border-t border-black dark:border-white mt-auto">
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center gap-4 text-center md:text-left">
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              Aldrin Suse
            </span>
            {/* vertical divider line */}
            <span className="hidden md:inline-block w-px h-4 bg-gray-300 dark:bg-zinc-700"></span>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {currentYear} All rights reserved.
            </p>
          </div>


          <button
            onClick={scrollToTop}
            className="group flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[var(--contact)] dark:hover:text-[var(--contact)] transition-colors duration-300"
          >
            <span>Back to top</span>
            <div className="p-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 group-hover:bg-[var(--contact)] group-hover:text-white transition-all duration-300">
              <ArrowUp className="w-4 h-4" />
            </div>
          </button>

        </div>
      </div>
    </footer>
  );
}