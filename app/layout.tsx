import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { Footer } from "@/app/components/footer";
import { Nav } from "@/app/components/nav";
import { validateContentGraph } from "@/lib/content";
import { isPublicHost } from "@/lib/site";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host");
  return {
    title: "Greg Frye",
    description: "Creative Director & Brand + Product Designer",
    // Review hosts (wip., *.vercel.app, local) stay out of search results.
    ...(isPublicHost(host) ? {} : { robots: { index: false, follow: false } }),
  };
}

validateContentGraph();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
