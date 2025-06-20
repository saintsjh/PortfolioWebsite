import Link from "next/link";
import NavBar from "@/components/NavBar";

export default function Contact() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="title">Contact Me</h1>
      <Link className="nav-link" href="https://www.linkedin.com/in/jesse-herrera-788570253/">Contact me on LinkedIn please! </Link>
      <NavBar currentPage="contact" />
    </main>
  );
} 