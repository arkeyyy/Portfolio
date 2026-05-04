import './App.css'
import Navbar from './components/Navbar';
import AboutPage from './components/AboutPage';
import ProjectsPage from './components/ProjectsPage';
import SkillsPage from './components/SkillsPage';
import CertificationsPage from './components/CertificationsPage';
import EducationPage from './components/EducationPage';
import ContactPage from './components/ContactPage';

function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <AboutPage/>
        
        <ProjectsPage/>

        <SkillsPage/>

        <CertificationsPage />

        <EducationPage />

        <ContactPage />

      </main>
    </div>
  );
}

export default App
