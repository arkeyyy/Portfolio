import './App.css'
import AboutPage from './components/AboutPage';
import Navbar from './components/Navbar';

function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <AboutPage/>
        

        <section id="projects" className="min-h-screen flex items-center justify-center pt-16">
          <h2 className="text-3xl text-gray-400">[Projects Section Placeholder]</h2>
        </section>

        <section id="skills" className="min-h-screen flex items-center justify-center pt-16">
          <h2 className="text-3xl text-gray-400">[Skills Section Placeholder]</h2>
        </section>

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
