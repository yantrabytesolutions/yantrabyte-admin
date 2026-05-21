import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  type?: string;
  imageUrl?: string;
}

export default function SEO({ 
  title, 
  description = "Yantrabyte Solutions offers professional CCTV installation, laptop repair, desktop repair, networking, biometric systems, and smart security solutions in Bangalore.",
  keywords = "CCTV installation Bangalore, laptop repair Bangalore, computer repair Bangalore, networking solutions Bangalore, IT services Bangalore, biometric systems Bangalore",
  canonicalUrl,
  type = "website",
  imageUrl = "https://yantrabyte.com/vite.svg"
}: SEOProps) {
  const url = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : 'https://yantrabyte.com');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Helmet>
  );
}
