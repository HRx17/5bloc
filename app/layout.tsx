import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
 title: "5Bloc — Where Projects Get Built",
 description: "Project coordination and contractor marketplace for AEC industry",
 manifest: "/manifest.json",
 appleWebApp: {
 capable: true,
 statusBarStyle: "black-translucent",
 title: "5Bloc",
 },
};

export const viewport: Viewport = {
 themeColor: "#121414",
 width: "device-width",
 initialScale: 1,
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html lang="en" className="h-full select-none">
 <head>
 {/* Load Google Fonts & Material Icons Outlined precisely as per design specification */}
 <link 
 href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400&family=Syne:wght@500;600&display=swap" 
 rel="stylesheet"
 />
 <link 
 href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" 
 rel="stylesheet"
 />
 </head>
 <body className="h-full bg-[var(--surface-canvas)] text-[var(--on-surface)] min-h-full overflow-hidden font-body">
 {children}
 </body>
 </html>
 );
}
