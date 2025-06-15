import Link from "next/link";
import Image from "next/image";
import TypingEffect from "@/components/TypingEffect";
import { homeContent } from './home-content'; // Import the content data

export default function Home() {
  return (
    <main>
      <header className="nav-header">
        <nav className="nav-links">
          <Link href="/projects" className="nav-link">
            Fun link
          </Link>
          <Link href="/contact" className="nav-link">
            Contact
          </Link>
          <Link href="/magnum-opus" className="nav-link">
            Magnum Opus
          </Link>
        </nav>
      </header>
      <div className="main-content-container">
        <div className="text-content">
          {/* Render Sections */}
          {homeContent.map((item, index) => {
            if (item.type === 'section') {
              return (
                <div className="content-section" key={index}>
                  <div className="section-body">
                    {item.body.type === 'heading' && (
                      <h1 className="main-heading">
                        <TypingEffect text={item.body.text} showBlinkingCursor={item.body.showBlinkingCursor} />
                      </h1>
                    )}
                    {item.body.type === 'paragraph' && (
                      <p>
                        <TypingEffect text={[item.body.text, item.body.text2, item.body.text3].filter(Boolean).join(' ')} />
                      </p>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          })}
          {/* Render the Projects List Separately */}
          <div className="content-section">
            <div className="section-body">
              <ul>
                {homeContent.map((item, index) => {
                  if (item.type === 'listItem') {
                    return (
                      <li className="list-item" key={index}>
                        <a href={item.href}>
                          <TypingEffect text={item.text} />
                        </a>
                      </li>
                    );
                  }
                  return null;
                })}
              </ul>
            </div>
          </div>
        </div>
        {/* Render the Image */}
        <div className="image-content">
          {homeContent.map((item, index) => {
            if (item.type === 'image') {
              return <Image key={index} className="profile-image" src={item.src} alt={item.alt} width={400} height={400} />;
            }
            return null;
          })}
        </div>
      </div>
    </main>
  );
}