export default function AnimatedBackground({ activeSection }: { activeSection: string }) {
  
  // Same color mapping sa Navbar.tsx
  const sectionColors: Record<string, string> = {
    about: 'var(--about)',
    projects: 'var(--projects)',
    skills: 'var(--skills)',
    certifications: 'var(--certifications)',
    education: 'var(--education)',
    contact: 'var(--contact)'
  };

  const currentColor = sectionColors[activeSection] || 'var(--about)';

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
      {/* Orb 1: Top Left */}
      <div 
        className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full blur-[100px] opacity-30 dark:opacity-20 animate-blob-fast"
        style={{ backgroundColor: currentColor, transition: 'background-color 1s ease-in-out' }}
      ></div>

      {/* Orb 2: Top Right (Delayed) */}
      {/* <div 
        className="absolute top-[20%] right-[-10%] w-[35vw] h-[35vw] rounded-full blur-[100px] opacity-30 dark:opacity-20 animate-blob-medium animation-delay-2000"
        style={{ backgroundColor: currentColor, transition: 'background-color 1s ease-in-out' }}
      ></div> */}

      {/* Orb 3: Bottom Left (Delayed) */}
      <div 
        className="absolute bottom-[-40%] left-[10%] w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-30 dark:opacity-20 animate-blob-slow animation-delay-4000"
        style={{ backgroundColor: currentColor, transition: 'background-color 1s ease-in-out' }}
      ></div>

      {/* Orb 4: Bottom Right (Delayed) */}
      <div 
        className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] rounded-full blur-[100px] opacity-30 dark:opacity-20 animate-blob-fast animation-delay-2000"
        style={{ backgroundColor: currentColor, transition: 'background-color 1s ease-in-out' }}
      ></div>
    </div>
  );
}