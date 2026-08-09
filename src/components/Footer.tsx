import { ArrowUp } from 'lucide-react';

export default function Footer() {

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
