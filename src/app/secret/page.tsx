import Link from 'next/link';
import { homeContent } from '../home-content';
import SecretPhysics from '@/components/SecretPhysics';

export default function SecretPage() {
    return (
        <main>
            <h1>Secret Page</h1>
            <p>Have some super cheeky fun.</p>
            <header className="nav-header">
                <nav className="nav-links">
                    <Link className="nav-link" href="/">Back to HomePage</Link>
                    <Link className="nav-link" href="/projects">Back to Fun Page</Link>
                    <Link className="nav-link" href="/magnum-opus">Magnum Opus</Link>
                </nav>
            </header>
            <SecretPhysics content={homeContent} />
        </main>
    )
} 