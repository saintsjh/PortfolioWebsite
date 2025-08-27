export interface SkillCategory {
  title: string;
  skills: string[];
}

export interface Job {
  title: string;
  company: string;
  date: string;
  description: string[];
}

export const moreAboutMeContent = [
  {
    type: 'section',
    heading: 'Skills',
    body: {
      type: 'skills',
      categories: [
        {
          title: 'Languages',
          skills: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'SQL (PostgreSQL, MySQL)', 'HTML5', 'CSS3/Sass', 'C++', 'C', 'Go']
        },
        {
          title: 'Frameworks & Libraries',
          skills: ['React', 'Next.js', 'Node.js', 'Express.js', '.NET', 'Spring Boot', 'Tailwind CSS', 'Orleans', 'Django', 'Django REST']
        },
        {
          title: 'Databases',
          skills: ['MongoDB', 'PostgreSQL', 'MySQL', 'Cosmos DB', 'Firebase']
        },
        {
          title: 'Tools & Platforms',
          skills: ['Git & GitHub', 'Docker', 'CI/CD', 'AWS', 'Vercel', 'Jira', 'Figma', 'UML']
        }
      ] as SkillCategory[]
    }
  },
  {
    type: 'section',
    heading: 'Experience',
    body: {
      type: 'experience',
      jobs: [
        {
          title: 'SDE Intern',
          company: 'Citi',
          date: 'June 2, 2025 - August 8, 2025',
          description: [
            'Utilizing Angular and Typescript to develop for Citi\'s internal applications.',
            'Collaborated with cross-functional teams to define, design, and ship new features.',
            'Created new UML diagrams for new application, that were used to guide development.',
            'Work with a large team to develop a new features for the existing applications in production.',
          ]
        },
        {
            title: 'Backend Development Intern',
            company: 'Sherps Inc.',
            date: 'November 1, 2024 - present',
            description: [
              'Utilized C# and .Net to develop a mobile application for iOS and Android.',
              'Implemented mapping features and data collection for the application.',
              'Learned about software development lifecycle and agile methodologies.'
            ]
        }
      ] as Job[]
    }
  }
]; 