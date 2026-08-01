import { ArrowUp } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-frame">
        <div className="footer-identity">
          <span className="footer-mark" aria-hidden="true">AS</span>
          <div>
            <strong>Aldrin Suse</strong>
            <p>Computer Science Student &amp; Software Builder</p>
          </div>
        </div>

        <p className="footer-copyright">© {currentYear} · Designed and built with care.</p>

        <a className="back-to-top" href="#about">
          Back to top
          <span aria-hidden="true">
            <ArrowUp />
          </span>
        </a>
      </div>
    </footer>
  );
}
