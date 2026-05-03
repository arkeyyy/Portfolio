
export default function AboutPage() {
  const scrollToProjects = () => {
    const element = document.getElementById('projects');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="about" className="min-h-[calc(100vh-76px)] flex items-center py-20">
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        
        {/* Left Side: Content */}
        <div className="order-2 lg:order-1 flex flex-col space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Hi, I'm Aldrin.
          </h1>
          
          <h2 className="text-2xl md:text-3xl text-[#00afff] font-semibold text-justify">
            CS student building web apps, interpreters, and system tools.
          </h2>
          
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl text-justify">
            I'm a Computer Science student passionate about full-stack development and system-level programming. I'm currently focused on completing a software engineering capstone—building a Resource Management MIS for a local agricultural cooperative. When I'm not coding, I'm usually tweaking my Linux terminal environment or exploring new tech stacks.
          </p>
          
          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={scrollToProjects}
              className="bg-[#00afff] hover:bg-[#52c9ff]  text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 cursor-pointer flex items-center justify-center"
            >
              View Projects
            </button>
            
            <a 
              href="/SUSE_Resume.pdf" 
              download
              className="px-8 py-3 rounded-lg text-black dark:text-white font-medium border border-black dark:border-white hover:bg-gray-300 dark:hover:bg-zinc-800 transition-colors duration-200 flex items-center justify-center"
            >
              Download Resume
            </a>
          </div>
        </div>

        {/* Right Side: Image Placeholder */}
        <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
          <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-2xl overflow-hidden border-4 border-[#00afff]/20 bg-gray-200 dark:bg-zinc-900 shadow-xl">
            {/* Replace the src with your actual image path later, e.g., '/profile.jpg' */}
            <img 
              src="https://via.placeholder.com/600x600/121212/0ea5e9?text=Aldrin" 
              alt="Aldrin" 
              className="object-cover w-full h-full"
            />
          </div>
        </div>

      </div>
    </section>
  );
}