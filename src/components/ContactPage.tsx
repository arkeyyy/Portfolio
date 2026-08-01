import { ArrowUpRight, Mail, Phone } from 'lucide-react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import SectionHeading from './SectionHeading';

const contactMethods = [
  {
    name: 'Email',
    value: 'susealdrin15@gmail.com',
    link: 'mailto:susealdrin15@gmail.com',
    icon: Mail,
    isExternal: false,
  },
  {
    name: 'Phone',
    value: '+63 945 380 6785',
    link: 'tel:+639453806785',
    icon: Phone,
    isExternal: false,
  },
  {
    name: 'GitHub',
    value: '@arkeyyy',
    link: 'https://github.com/arkeyyy',
    icon: FaGithub,
    isExternal: true,
  },
  {
    name: 'LinkedIn',
    value: 'Aldrin Suse',
    link: 'https://www.linkedin.com/in/arkeyy/',
    icon: FaLinkedin,
    isExternal: true,
  },
];

export default function ContactPage() {
  return (
    <section id="contact" className="page-section contact-section" aria-labelledby="contact-title">
      <SectionHeading
        id="contact-title"
        eyebrow="Connect"
        title="Let’s make something useful."
        description="Curious about my work or interested in collaborating? Send a message and tell me what you have in mind. I am always open to a good conversation."
        color="var(--contact-ink)"
      />

      <div className="contact-panel">
        <div className="contact-panel-glow" aria-hidden="true" />

        <div className="contact-invitation">
          <p className="contact-kicker">Start a conversation</p>
          <h3>Good work starts with a clear hello.</h3>
          <p>
            Tell me what you&apos;re building, what you need help with, or what you think we should
            explore together.
          </p>
          <a className="button contact-button" href="mailto:susealdrin15@gmail.com">
            <Mail aria-hidden="true" />
            Send me an email
            <ArrowUpRight aria-hidden="true" />
          </a>
        </div>

        <div className="contact-methods">
          {contactMethods.map((method) => (
            <a
              key={method.name}
              href={method.link}
              target={method.isExternal ? '_blank' : undefined}
              rel={method.isExternal ? 'noopener noreferrer' : undefined}
              className="contact-method"
              aria-label={`${method.name}: ${method.value}`}
            >
              <span className="contact-method-icon">
                <method.icon aria-hidden="true" />
              </span>
              <span className="contact-method-copy">
                <span>{method.name}</span>
                <strong>{method.value}</strong>
              </span>
              <ArrowUpRight className="contact-method-arrow" aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
