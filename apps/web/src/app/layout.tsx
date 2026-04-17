import type { Metadata } from "next";
import { Jua, Gowun_Dodum, Hi_Melody } from "next/font/google";
import "./globals.css";
import { FontProvider } from "@/components/FontProvider";
import { PageTransition } from "@/components/PageTransition";

const jua = Jua({
  variable: "--font-option-jua",
  weight: "400",
  subsets: ["latin"],
});

const gowunDodum = Gowun_Dodum({
  variable: "--font-option-gowun",
  weight: "400",
  subsets: ["latin"],
});

const hiMelody = Hi_Melody({
  variable: "--font-option-hi-melody",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "일본어 학습 AI",
  description: "AI와 함께하는 일본어 학습 — 채팅, 이미지 분석, JLPT 수준 측정",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${jua.variable} ${gowunDodum.variable} ${hiMelody.variable} antialiased`}
      >
        <FontProvider />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
