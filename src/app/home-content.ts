// Homepage content types
interface HeadingBody {
  type: 'heading';
  text: string;
  showBlinkingCursor: boolean;
}

interface ParagraphBody {
  type: 'paragraph';
  text: string;
  text2?: string;
  text3?: string;
}

interface ListItemContent {
  type: 'listItem';
  heading?: string;
  text: string;
  href: string;
  description: string;
}

interface SectionContent {
  type: 'section';
  heading: string;
  body: HeadingBody | ParagraphBody;
}

interface ImageContent {
  type: 'image';
  src: string;
  alt: string;
}
interface ImageContent2 {
  type: 'image2';
  src: string;
  alt: string;
}

export type HomeContentItem = SectionContent | ImageContent | ListItemContent | ImageContent2;

// Greetings in different languages
export const greetings = [
  'Hello',
  'Hola',
  'Bonjour',
  'Hallo',
  'Ciao',
  'Olá',
  'Привет',
  '你好',
  'こんにちは',
  '안녕하세요',
  'مرحبا',
  'नमस्ते',
  'Hej',
  'Hei',
  'Γεια σας',
  'Merhaba',
  'Shalom',
  'Sawubona',
  'Jambo',
  'Aloha'
];

// Get random greeting
export const getRandomGreeting = (): string => {
  const randomIndex = Math.floor(Math.random() * greetings.length);
  return greetings[randomIndex].trim().replace(/\s+/g, ' ').trim();
};

// Homepage content data
export const homeContent: HomeContentItem[] = [
  {
    type: 'section',
    heading: '',
    body: {
      type: 'heading',
      text: 'Hello, I am Jesse Herrera',
      showBlinkingCursor: true,
    },
  },
  {
    type: 'section',
    heading: 'About',
    body: {
      type: 'paragraph',
      text: "I have a passion for working with people making projects.",
      text2: "I'm experienced with building full stack and mobile apps.",
      text3: "Using tech like React, Next.js, TypeScript, .Net.",
    },
  },
  {
    type: 'listItem',
    text: '00. AWS CloudSharing Project',
    href: 'https://github.com/saintsjh/AwsCloudSharing',
    description: 'A serverless file sharing application built with TypeScript, utilizing AWS Lambda, S3, and other cloud services for a scalable and cost-effective solution.',
  },
  {
    type: 'listItem',
    text: '01. PyFaceID Project',
    href: 'https://github.com/saintsjh/PyFaceID',
    description: 'A facial recognition system implemented in Python, capable of identifying and verifying individuals from image or video sources.',
  },
  {
    type: 'listItem',
    text: '02. Employee Expense Reporting Information System',
    href: '',
    description: 'A full-stack information system designed to streamline and manage employee expense reports, built with a focus on usability and data integrity.',
  },
  {
    type: 'listItem',
    text: '03. StreamFlow',
    href: 'https://github.com/saintsjh/StreamFlow',
    description: 'A video streaming application built with React Native, Expo, TypeScript and Go, featuring a modern UI and smooth streaming experience. This project was built for a hackathon.',
  },
  {
    type: 'listItem',
    text: '04. Elden Counter',
    href: 'https://github.com/saintsjh/EldenCounter',
    description: 'A tool for tracking deaths in the game Elden Ring.',
  },
  {
    type: 'listItem',
    text: '05. Arduino Robot',
    href: 'https://github.com/saintsjh/ArduinoRobot',
    description: 'An open-source, 3D-printed robotic arm powered by an Arduino, designed to be a low-cost, effective learning tool for robotics and automation.',
  },
  {
    type: 'image',
    src: '/imgs/IMG_2635.jpeg',
    alt: 'Jesse Herrera',
  },
  {
    type: 'image2',
    src: '/imgs/JH(2).png',
    alt: 'Jesse Herrera',
  }
]; 