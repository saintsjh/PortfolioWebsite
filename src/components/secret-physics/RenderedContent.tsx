import { FlyingContentObject } from "@/types";
import Image from "next/image";
import TypingEffect from "../TypingEffect";

// A sub-component to render the final, animated content
const RenderedContent: React.FC<{object: FlyingContentObject}> = ({object}) => {
    const style = {
        position: 'absolute' as const,
        left: 0,
        top: 0,
        transform: `translate(${object.x}px, ${object.y}px) rotate(${object.rotation}deg)`,
        transformOrigin: 'center center',
        willChange: 'transform',
        padding: '10px',
        borderRadius: '8px',
        background: 'rgba(40, 45, 56, 0.8)',
        border: '1px solid var(--ayu-comment)',
        color: 'var(--ayu-fg)',
        display: 'inline-block',
        whiteSpace: 'nowrap',
    };

    const item = object.content;

    if (item.type === 'image' || item.type === 'image2') {
        return (
            <div style={style}>
                <Image className="profile-image" src={item.src} alt={item.alt} width={150} height={150} style={{ borderRadius: '8px' }}/>
            </div>
        )
    }

    if (item.type === 'section') {
        const body = item.body;
        return (
            <div style={style}>
                <span style={{fontWeight: 700, color: 'var(--ayu-orange)', marginRight: '1rem'}}>{item.heading}</span>
                <span>
                    {body.type === 'heading' && <TypingEffect text={body.text} />}
                    {body.type === 'paragraph' && <TypingEffect text={body.text} />}
                </span>
            </div>
        )
    }
    
    if (item.type === 'listItem') {
        return (
            <div style={style}>
                <TypingEffect text={item.text} />
            </div>
        )
    }

    return null;
}

export default RenderedContent; 