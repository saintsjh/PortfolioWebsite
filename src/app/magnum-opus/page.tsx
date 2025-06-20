'use client';

import Link from 'next/link';
import { homeContent } from '../home-content';
import CharacterPhysics from '@/components/CharacterPhysics';
import NavBar from "@/components/NavBar";

export default function MagnumOpusPage() {
    return (
        <main style={{ backgroundColor: 'var(--ayu-bg)', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <CharacterPhysics content={homeContent} />
            <NavBar currentPage="magnum-opus" />
        </main>
    )
} 