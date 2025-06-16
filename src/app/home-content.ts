// Type definitions for the homepage content
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
  heading: string; // "Projs." for all of them
  text: string;
  href: string;
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

export type HomeContentItem = SectionContent | ImageContent | ListItemContent;

// Collection of "Hello" greetings in different languages
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

// Function to get a random greeting
export const getRandomGreeting = (): string => {
  const randomIndex = Math.floor(Math.random() * greetings.length);
  return greetings[randomIndex].trim().replace(/\s+/g, ' ').trim();
};

// The actual content for the homepage
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
      text: 'I have a passion for working with people and building applications.',
      text2: 'I have experience building full stack applications and mobile apps. Using',
      text3: 'technologies like React, Next.js, Tailwind CSS, TypeScript, .Net, and more.'
    },
  },
  { type: 'listItem', heading: 'Projs.', text: '00. AWS CloudSharing Project', href: 'https://github.com/saintsjh/AwsCloudSharing' },
  { type: 'listItem', heading: 'Projs.', text: '01. PyFaceID Project', href: 'https://github.com/saintsjh/PyFaceID' },
  { type: 'listItem', heading: 'Projs.', text: '02. Employee Expense Reporting Information System', href: '' },
  { type: 'listItem', heading: 'Projs.', text: '03. Elden Counter', href: 'https://github.com/saintsjh/EldenCounter' },
  { type: 'listItem', heading: 'Projs.', text: '04. Arduino Robot', href: 'https://github.com/saintsjh/ArduinoRobot' },
  {
    type: 'image',
    src: '/imgs/IMG_2635.jpeg',
    alt: 'Jesse Herrera',
  },
]; 