import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "69.l.cd";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: "今天，宇宙为你点亮｜生日快乐",
    description: "一封藏在星光里的生日情书，献给我最爱的女孩。",
    icons: { icon: "/og.png", shortcut: "/og.png" },
    openGraph: {
      title: "今天，宇宙为你点亮",
      description: "一封藏在星光里的生日情书。",
      type: "website",
      locale: "zh_CN",
      images: [{ url: `${origin}/og.png`, width: 1536, height: 1024, alt: "星际生日蛋糕与生日祝福" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "今天，宇宙为你点亮",
      description: "一封藏在星光里的生日情书。",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
