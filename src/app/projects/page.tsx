import PhysicsCanvas from "@/components/PhysicsCanvas";
import Link from "next/link";

export default function Projects() {
  return (
    <div>
      <PhysicsCanvas />
      <h1>FUN PAGE</h1>
      <p>Have some cheeky fun.</p>
      <header className="nav-header">
        <nav className="nav-links">
          <Link className="nav-link" href="/">Back to HomePage</Link>
          {/* <Link className="nav-link" href="/secret">Secret Page</Link> */}
          <Link className="nav-link" href="/magnum-opus">Magnum Opus</Link>
        </nav>
      </header>
    </div>
  );
} 