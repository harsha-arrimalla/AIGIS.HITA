"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { HomeNav } from "@/components/home/home-nav";
import { HeroSection } from "@/components/home/hero-section";
import { PhotoMarquee } from "@/components/home/photo-marquee";
import { CategoryTiles } from "@/components/home/category-tiles";
import { ThingsToDo } from "@/components/home/things-to-do";
import { AiPowers } from "@/components/home/ai-powers";
import { HowItWorks } from "@/components/home/how-it-works";
import { TopDestinations } from "@/components/home/top-destinations";
import { TravelerStories } from "@/components/home/traveler-stories";
import { CtaBanner } from "@/components/home/cta-banner";
import { HomeFooter } from "@/components/home/home-footer";

export default function HomePage() {
  const router = useRouter();

  const sendPrompt = useCallback(
    (text: string) => {
      sessionStorage.setItem("hita-initial-message", text);
      router.push("/chat");
    },
    [router],
  );

  return (
    <div className="min-h-screen bg-canvas font-[family-name:var(--font-body)]">
      <HomeNav />
      <main id="main-content">
        <HeroSection />
        <PhotoMarquee />
        <CategoryTiles onSendPrompt={sendPrompt} />
        <ThingsToDo onSendPrompt={sendPrompt} />
        <AiPowers />
        <HowItWorks />
        <TopDestinations onSendPrompt={sendPrompt} />
        <TravelerStories />
        <CtaBanner />
      </main>
      <HomeFooter />
    </div>
  );
}
