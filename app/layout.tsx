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
 themeColor: "#0C1220",
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
 href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" 
 rel="stylesheet"
 />
 <link 
 href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" 
 rel="stylesheet"
 />
 </head>
 <body className="h-full bg-navy text-white min-h-full overflow-hidden">
 {children}
 </body>
 </html>
 );
}
