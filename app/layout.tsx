import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
 title: "5Bloc — Where Projects Get Built",
 description:
   "5Bloc is the project coordination platform for the AEC industry. Architects coordinate, contractors bid and deliver, vendors get discovered. One workspace for everyone on the build.",
 manifest: "/manifest.json",
 appleWebApp: {
 capable: true,
 statusBarStyle: "default",
 title: "5Bloc",
 },
};

export const viewport: Viewport = {
 themeColor: "#FAFAF8",
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
 <link
 href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
 rel="stylesheet"
 />
 <link
 href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
 rel="stylesheet"
 />
 <script
   dangerouslySetInnerHTML={{
     __html: `(function(){try{var t=localStorage.getItem('theme');var r=document.documentElement;if(t==='dark'){r.classList.add('dark')}else{r.classList.remove('dark')}}catch(e){}})()`,
   }}
 />
 </head>
 <body className="h-full bg-[var(--surface-canvas)] text-[var(--on-surface)] min-h-full overflow-hidden font-body">
 {children}
 </body>
 </html>
 );
}
