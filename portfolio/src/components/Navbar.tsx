// src/components/Navbar.tsx
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Added the dark:hover variant so it overrides dark:text-white
  const navItems = [
    { name: 'About', hoverClass:           'hover:text-[var(--about)]           dark:hover:text-[var(--about)]' },
    { name: 'Projects', hoverClass:        'hover:text-[var(--projects)]        dark:hover:text-[var(--projects)]' },
    { name: 'Skills', hoverClass:          'hover:text-[var(--skills)]          dark:hover:text-[var(--skills)]' },
    { name: 'Certifications', hoverClass:  'hover:text-[var(--certifications)]  dark:hover:text-[var(--certifications)]' },
    { name: 'Education', hoverClass:       'hover:text-[var(--education)]       dark:hover:text-[var(--education)]' },
    { name: 'Contact', hoverClass:         'hover:text-[var(--contact)]         dark:hover:text-[var(--contact)]' },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id.toLowerCase());
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-black border-b border-black dark:border-white transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[76px]">
          
          {/* Logo / Brand (Left) */}
          <div className="flex-shrink-0 cursor-pointer text-xl font-bold tracking-tighter" onClick={() => scrollToSection('about')}>
            Aldrin<span className="text-accent"> S.</span>
          </div>

          {/* Right Side Group: Nav Links + Theme Toggle */}
          <div className="flex items-center space-x-6">
            
            {/* Desktop Nav Links */}
            <div className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => scrollToSection(item.name)}
                  // Removed the generic hover:text-accent and injected ${item.hoverClass}
                  className={`text-[18px] font-medium text-black dark:text-white transition-colors cursor-pointer ${item.hoverClass}`}
                >
                  {item.name}
                </button>
              ))}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors focus:outline-none"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? (
                <Sun className="h-7 w-7 text-accent" />
              ) : (
                <Moon className="h-7 w-7 text-gray-600" />
              )}
            </button>
            
          </div>

        </div>
      </div>
    </nav>
  );
}