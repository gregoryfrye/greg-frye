import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { Footer } from "@/app/components/footer";
import { Nav } from "@/app/components/nav";
import { getClientLeadImageUrl, validateContentGraph } from "@/lib/content";
import { isPublicHost } from "@/lib/site";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host");
  const description = "Creative Director & Brand + Product Designer";
  // Placeholder share image until a designed one exists: the lead Hudson image.
  const shareImage = getClientLeadImageUrl("hudson-cannabis");
  return {
    metadataBase: new URL(`https://${host ?? "gregfrye.us"}`),
    title: "Greg Frye",
    description,
    openGraph: {
      type: "website",
      siteName: "Greg Frye",
      title: "Greg Frye",
      description,
      ...(shareImage ? { images: [shareImage] } : {}),
    },
    twitter: { card: "summary_large_image" },
    // Review hosts (wip., *.vercel.app, local) stay out of search results.
    ...(isPublicHost(host) ? {} : { robots: { index: false, follow: false } }),
  };
}

validateContentGraph();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <a
          href="#content"
          className="sr-only z-20 bg-canvas px-gutter py-nav text-body text-ink focus:not-sr-only focus:fixed focus:top-0 focus:left-0"
        >
          Skip to content
        </a>
        <Nav />
        <div id="content" tabIndex={-1} className="flex flex-1 flex-col">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
