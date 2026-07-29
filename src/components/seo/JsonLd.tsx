import { SITE_AUTHOR, SITE_GITHUB, SITE_NAME, SITE_TAGLINE, getSiteUrl } from "@/lib/site";

export function JsonLd() {
  const url = getSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        url,
        name: SITE_NAME,
        description: SITE_TAGLINE,
        inLanguage: "en",
        publisher: { "@id": `${url}/#person` },
        author: { "@id": `${url}/#person` },
      },
      {
        "@type": "Person",
        "@id": `${url}/#person`,
        name: SITE_AUTHOR,
        url,
        sameAs: [SITE_GITHUB],
      },
      {
        "@type": "WebApplication",
        "@id": `${url}/#app`,
        name: SITE_NAME,
        url,
        description: SITE_TAGLINE,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        author: { "@id": `${url}/#person` },
        codeRepository: SITE_GITHUB,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "CAD",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
