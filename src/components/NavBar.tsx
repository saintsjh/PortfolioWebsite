import Link from "next/link";

interface NavBarProps {
  currentPage?: string;
}

export default function NavBar({ currentPage }: NavBarProps) {
  const navItems = [
    { href: "/", label: "Home", key: "home" },
    { href: "/projects", label: "Fun link", key: "projects" },
    { href: "/contact", label: "Contact", key: "contact" },
    { href: "/more-about-me", label: "More About Me", key: "more-about-me" }
  ];

  return (
    <header className="nav-header">
      <nav className="nav-links">
        {navItems.map((item) => {
          const isCurrentPage = currentPage === item.key;
          
          if (isCurrentPage) {
            return (
              <span 
                key={item.key}
                className="nav-link nav-link-current"
                style={{ color: 'var(--ayu-orange)', cursor: 'default' }}
              >
                {item.label}
              </span>
            );
          }
          
          return (
            <Link href={item.href} className="nav-link" key={item.key}>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
} 