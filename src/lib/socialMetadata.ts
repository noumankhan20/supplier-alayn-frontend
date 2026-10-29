import type { Metadata } from "next";

const SITE_URL = "https://suppliers.alaynai.com";
const SHARE_IMAGE = { url: "/alaynlogo.png", width: 1200, height: 630, alt: "Alayn Supplier Network" };

export function socialMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${path}`,
      siteName: "Alayn Suppliers",
      locale: "en_IN",
      type: "website",
      images: [SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SHARE_IMAGE.url],
    },
  };
}
