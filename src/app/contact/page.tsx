import Link from "next/link";

export default function Contact() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="title">Contact Me</h1>
      <Link className="nav-link" href="https://www.linkedin.com/in/jesse-herrera-788570253/">Contact me on LinkedIn please! </Link>
      <header className="nav-header">
            <nav className="nav-links">
              <Link className="nav-link" href="/">Back to HomePage</Link>
              <Link className="nav-link" href="/projects">Back to Fun Page</Link>
              <Link className="nav-link" href="/magnum-opus">Back to Magnum Opus</Link>
            </nav>
        </header>
    </main>
  );
} 