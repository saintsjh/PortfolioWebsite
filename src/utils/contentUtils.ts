import { HomeContentItem } from '@/app/home-content';
import { DeconstructedItem } from '@/types';

// Deconstructs the page content into a flat list of characters and images.
export const deconstructContent = (content: HomeContentItem[], randomHello: string, isMobile: boolean): DeconstructedItem[] => {
  const deconstructed: DeconstructedItem[] = [];
  
  content.forEach(item => {
    if (item.type === 'section') {
      // Add section heading characters if they exist
      if (item.heading && item.heading.trim() !== '') {
        item.heading.split('').forEach(char => {
          deconstructed.push({ type: 'char', char, style: 'section-heading' });
        });
      }
      
      const style = item.body.type === 'heading' ? 'heading' : 'paragraph';
      if (item.body.type === 'heading') {
        // Handle the greeting specially - split into greeting and rest
        if (item.body.text.includes('Hello, I am Jesse Herrera')) {
          // Add greeting characters with 'greeting' style
          randomHello.split('').forEach(char => {
            deconstructed.push({ type: 'char', char, style: 'greeting' });
          });
          // Add the rest with 'heading' style
          ', I am Jesse Herrera'.split('').forEach(char => {
            deconstructed.push({ type: 'char', char, style });
          });
        } else {
          item.body.text.split('').forEach(char => {
            deconstructed.push({ type: 'char', char, style });
          });
        }
      } else if (item.body.type === 'paragraph') {
        if (isMobile) {
          const mobileLines = [
            "I have a passion for working with people",
            "and building applications. I have",
            "experience building full stack",
            "applications and mobile apps. Using",
            "technologies like React, Next.js,",
            "Tailwind CSS, TypeScript, .Net, and more."
          ];
          mobileLines.forEach((line, index) => {
            line.split('').forEach(char => deconstructed.push({ type: 'char', char, style: 'paragraph' }));
            if (index < mobileLines.length - 1) {
              deconstructed.push({ type: 'char', char: '\n', style: 'paragraph' });
            }
          });
        } else {
          const { text, text2, text3 } = item.body;
          text.split('').forEach(char => deconstructed.push({ type: 'char', char, style }));
          if (text2) {
            text2.split('').forEach(char => deconstructed.push({ type: 'char', char, style }));
          }
          if (text3) {
            text3.split('').forEach(char => deconstructed.push({ type: 'char', char, style }));
          }
        }
      }
    } else if (item.type === 'listItem') {
      // Add "Projs" heading only once for the first list item
      if (item === content.find(i => i.type === 'listItem')) {
        'Projs'.split('').forEach(char => {
          deconstructed.push({ type: 'char', char, style: 'section-heading' });
        });
      }
      
      // Check if text starts with a number pattern (e.g., "00. ")
      const match = item.text.match(/^(\d+\.\s)(.+)$/);
      if (match) {
        const number = match[1];
        const projectName = match[2];
        // Mark number characters as 'number' style
        number.split('').forEach(char => {
          deconstructed.push({ type: 'char', char, style: 'number' });
        });
        // Mark project name characters as 'link' style
        projectName.split('').forEach(char => {
          deconstructed.push({ type: 'char', char, style: 'link' });
        });
      } else {
        item.text.split('').forEach(char => {
          deconstructed.push({ type: 'char', char, style: 'link' });
        });
      }
    } 
    // The image is no longer deconstructed into a physics object
  });
  return deconstructed;
}; 