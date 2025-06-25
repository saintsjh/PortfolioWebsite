import { HomeContentItem } from "@/app/home-content";
import Image from "next/image";
import TypingEffect from "../TypingEffect";

// A sub-component that renders the content for both measurement and final display
const StaticContent: React.FC<{item: HomeContentItem, "data-id"?: number}> = ({item, "data-id": dataId}) => {
    if (item.type === 'section') {
      const body = item.body;
      return (
        <div className="content-section" data-id={dataId} style={{display: 'flex', alignItems:'baseline', gap: '2rem'}}>
          <div className="section-heading" style={{flex: '0 0 100px', textAlign: 'right', fontWeight: 700}}>{item.heading}</div>
          <div className="section-body">
            {body.type === 'heading' && <h1 className="main-heading"><TypingEffect text={body.text} /></h1>}
            {body.type === 'paragraph' && <p><TypingEffect text={body.text + " " + "Also fun things!"} /></p>}
          </div>
        </div>
      );
    }

    if (item.type === 'listItem') {
        return (
            <div className="content-section" data-id={dataId} style={{display: 'flex', alignItems:'baseline', gap: '2rem'}}>
                <div className="section-heading" style={{flex: '0 0 100px', textAlign: 'right', fontWeight: 700}}>{item.heading}</div>
                <div className="list-item"><TypingEffect text={item.text} /></div>
            </div>
        );
    }

    if (item.type === 'image') {
      return (
        <div className="image-content" data-id={dataId}>
          <Image className="profile-image" src={item.src} alt={item.alt} width={200} height={200} />
        </div>
      );
    }

    return null;
}

export default StaticContent; 