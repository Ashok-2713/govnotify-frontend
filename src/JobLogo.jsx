import { useState, useMemo } from "react";

export function getOrgLogo(stateName, organization, title) {
  const str = `${stateName || ''} ${organization || ''} ${title || ''}`.toLowerCase();
  if (str.includes("railway") || str.includes("rrb") || str.includes("ntpc")) return "/logos/railway.png";
  if (str.includes("ssc") || str.includes("staff selection")) return "/logos/ssc.png";
  if (str.includes("upsc") || str.includes("union public service")) return "/logos/upsc.png";
  if (str.includes("post") || str.includes("dak")) return "/logos/post.png";
  if (str.includes("tamil nadu") || str.includes("tnpsc")) return "/logos/tamilnadu.png";
  if (str.includes("karnataka") || str.includes("kpsc") || str.includes("kea")) return "/logos/karnataka.png";
  if (str.includes("kerala")) return "/logos/kerala.png";
  if (str.includes("andhra") || str.includes("appsc")) return "/logos/andhra.png";
  if (str.includes("telangana") || str.includes("tspsc")) return "/logos/telangana.png";
  if (str.includes("central") || str.includes("india") || str.includes("govt")) return "/logos/central.png";
  return null;
}

export default function JobLogo({ url, organization, state, title, size = 42 }) {
  const orgLogo = getOrgLogo(state, organization, title);
  const getDomain = (u) => {
    if (!u) return null;
    try { return new URL(u).hostname; } catch { return null; }
  };
  const domain = getDomain(url);
  const sources = useMemo(() => [
    orgLogo,
    domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null,
    domain ? `https://logo.clearbit.com/${domain}` : null,
    null
  ].filter(Boolean), [orgLogo, domain]);

  const [stage, setStage] = useState(0);
  const currentSrc = sources[stage] || null;
  const handleError = () => { if (stage < sources.length - 1) setStage(prev => prev + 1); };

  if (!currentSrc) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'linear-gradient(135deg, #10b981, #2563eb)',
        color: '#ffffff', display: 'grid', placeItems: 'center',
        fontWeight: 800, fontSize: Math.max(13, Math.round(size * 0.38)), flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {organization?.charAt(0) || state?.charAt(0) || '?'}
      </div>
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: '#ffffff', border: '1.5px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 3, flexShrink: 0, overflow: 'hidden'
    }}>
      <img
        src={currentSrc}
        alt={organization || state || "Seal"}
        onError={handleError}
        style={{
          width: '100%', height: '100%', objectFit: 'contain',
          borderRadius: '50%', imageRendering: '-webkit-optimize-contrast'
        }}
      />
    </div>
  );
}
