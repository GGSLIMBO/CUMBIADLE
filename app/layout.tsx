import type { Metadata } from "next";
import { Outfit } from "next/font/google"; // <--- CAMBIAR AQUÍ
import "./globals.css";

// Configurar Outfit
const outfit = Outfit({ subsets: ["latin"] }); // <--- CAMBIAR AQUÍ

export const metadata: Metadata = {
  title: "CumbiaGuess",
  description: "Adiviná el tema de cumbia del día",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={outfit.className}>{children}</body> {/* <--- USAR AQUÍ */}
    </html>
  );
}
