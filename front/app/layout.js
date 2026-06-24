import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "./components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AdoptMe",
  description: "AdoptMe - Encuentra tu mascota ideal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-stone-800 antialiased dark:bg-zinc-950 dark:text-zinc-100`}
      >
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
