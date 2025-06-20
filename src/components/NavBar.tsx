import Link from "next/link";

export default function NavBar() {
  return (
    <header className="nav-header">
      <nav className="nav-links">
        <Link href="/" className="nav-link">
          Home
        </Link>
        <Link href="/projects" className="nav-link">
          Fun link
        </Link>
        <Link href="/contact" className="nav-link">
          Contact
        </Link>
        <Link href="/magnum-opus" className="nav-link">
          Magnum Opus
        </Link>
        <Link href="/more-about-me" className="nav-link">
          More About Me
        </Link>
      </nav>
    </header>
  );
} 