# Jesse Herrera's Interactive Portfolio

This is the source code for my personal portfolio website, built with Next.js and featuring a variety of interactive physics simulations. The goal was to create a memorable and engaging experience that showcases both my technical skills and my creative side.

## Features

- **Interactive Physics Simulations**: The site features three different physics simulations:
  1.  **Character Physics**: The main text content is composed of individual characters that can be scattered and will return to their original position.
  2.  **Particle Canvas**: A full-screen particle simulation that interacts with the user's cursor, running in a Web Worker for performance.
  3.  **Secret "Flying" Content**: A hidden physics simulation where content items fly around the screen.
- **Modern Tech Stack**: Built with the latest web technologies, including Next.js App Router, TypeScript, and React Hooks.
- **Responsive Design**: The website is fully responsive and provides a tailored experience for both desktop and mobile users.
- **Performance Optimized**: Uses Web Workers, `requestAnimationFrame`, and efficient data handling (ArrayBuffers) to ensure smooth animations.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 14 (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Custom CSS with CSS Variables
- **Deployment**: [Vercel](https://vercel.com/)

## Project Structure Overview

The project is organized following standard Next.js conventions, with some key directories:

-   `src/app`: Contains all the pages and routes of the application, as well as global styles.
-   `src/components`: Contains all the reusable React components. The physics simulations are broken down into sub-directories here.
-   `src/hooks`: Holds custom React hooks that encapsulate complex logic, such as the physics simulations.
-   `src/styles`: Contains modularized CSS files, split by concern (theme, layout, components, etc.).
-   `src/types`: Centralized TypeScript type definitions for the project.
-   `src/utils`: Utility functions that can be shared across the application.
-   `src/workers`: Contains the Web Worker code for the particle simulation.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You will need to have [Node.js](https://nodejs.org/en/) (v18.17 or later) and a package manager like `npm` or `yarn` installed.

### Installation

1.  Clone the repo
    ```sh
    git clone https://github.com/saintsjh/ResumeWebsite.git
    ```
2.  Navigate to the project directory
    ```sh
    cd jesse-website
    ```
3.  Install NPM packages
    ```sh
    npm install
    ```

### Running the Development Server

Run the following command to start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The page will auto-update as you edit the files.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
