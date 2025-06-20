import { homeContent } from '../home-content';
import SecretPhysics from '@/components/SecretPhysics';
import NavBar from "@/components/NavBar";

export default function SecretPage() {
    return (
        <main>
            <h1>Secret Page</h1>
            <p>Have some super cheeky fun.</p>
            <NavBar />
            <SecretPhysics content={homeContent} />
        </main>
    )
} 