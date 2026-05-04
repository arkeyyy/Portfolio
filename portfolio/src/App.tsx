import './App.css'
import Navbar from './components/Navbar';
import AboutPage from './components/AboutPage';
import ProjectsPage from './components/ProjectsPage';
import SkillsPage from './components/SkillsPage';
import CertificationsPage from './components/CertificationsPage';
import EducationPage from './components/EducationPage';
import ContactPage from './components/ContactPage';
import AnimatedBackground from './components/AnimatedBackground';
import { useState, useEffect } from 'react';

function App() {
  const [activeSection, setActiveSection] = useState('about');

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-50% 0px -50% 0px', 
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    const sections = ['about', 'projects', 'skills', 'certifications', 'education', 'contact'];
    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);


  return (
    <div className="relative min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-300">
      
      <AnimatedBackground activeSection={activeSection} />
      <div className="relative z-10">
        <Navbar activeSection={activeSection} />
        
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AboutPage />
          <ProjectsPage />
          <SkillsPage />
          <CertificationsPage />
          <EducationPage />
          <ContactPage />
        </main>
      </div>

    </div>
  );
}

export default App
