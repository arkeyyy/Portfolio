import './App.css'
import Navbar from './components/Navbar';
import AboutPage from './components/AboutPage';
import ProjectsPage from './components/ProjectsPage';
import SkillsPage from './components/SkillsPage';

function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <AboutPage/>
        
        <ProjectsPage/>

        <SkillsPage/>

        <section id="certifications" className="min-h-screen flex items-center justify-center pt-16">
          <h2 className="text-3xl text-gray-400">[Certifications Section Placeholder]</h2>
        </section>

        <section id="education" className="min-h-screen flex items-center justify-center pt-16">
          <h2 className="text-3xl text-gray-400">[Education Section Placeholder]</h2>
        </section>

        <section id="contact" className="min-h-screen flex items-center justify-center pt-16">
          <h2 className="text-3xl text-gray-400">[Contact Section Placeholder]</h2>
        </section>

      </main>
    </div>
  );
}

export default App
