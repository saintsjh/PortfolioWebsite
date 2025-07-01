import type { Metadata } from "next";
import { Fira_Code } from "next/font/google";
import "./globals.css";

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira-code",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://saintsjh.com"),
  title: "Jesse Herrera - Portfolio",
  description: "I'm a Computer Science major at the University of South Florida, always eager to learn, collaborate, and take on new challenges. Excited to connect with like-minded people and explore new opportunities!",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  openGraph: {
    title: "Jesse Herrera - Portfolio",
    description: "I'm a Computer Science major at the University of South Florida, always eager to learn, collaborate, and take on new challenges. Excited to connect with like-minded people and explore new opportunities!",
    url: "https://saintsjh.com",
    siteName: "Jesse Herrera's Portfolio",
    images: [
      {
        url: "/imgs/IMG_2635.jpeg",
        width: 1200,
        height: 630,
        alt: "Jesse Herrera",
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body className={`${firaCode.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
