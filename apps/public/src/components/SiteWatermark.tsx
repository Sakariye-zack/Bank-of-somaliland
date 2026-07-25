import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { mediaUrl } from '../lib/media';

// A single faint mark centered on the viewport of every page — configured
// once in the admin panel's Website Settings rather than baked into markup.
export function SiteWatermark() {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    api.siteSettings().then((s) => setUrl(s.watermark_url)).catch(() => {});
  }, []);

  if (!url) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(46vw, 620px)',
        height: 'min(46vw, 620px)',
        zIndex: 0,
        pointerEvents: 'none',
        backgroundImage: `url(${mediaUrl(url)})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: 'contain',
        opacity: 0.1,
        mixBlendMode: 'multiply',
      }}
    />
  );
}
