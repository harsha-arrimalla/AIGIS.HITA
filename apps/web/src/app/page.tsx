"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { HomeNav } from "@/components/home/home-nav";
import { HeroSection } from "@/components/home/hero-section";
import { LiveTrustStrip } from "@/components/home/live-trust-strip";
import { FeaturedTip } from "@/components/home/featured-tip";
import { WhatHitaDoes } from "@/components/home/what-hita-does";
import { ArticlesSection } from "@/components/home/articles-section";
import { ThingsToDo } from "@/components/home/things-to-do";
import { HowItWorks } from "@/components/home/how-it-works";

import { BuiltDifferent } from "@/components/home/built-different";
import { MoreToExplore } from "@/components/home/more-to-explore";
import { WeekendGetaways } from "@/components/home/weekend-getaways";
import { TopDestinations } from "@/components/home/top-destinations";
import { NumbersThatMatter } from "@/components/home/numbers-that-matter";
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
        <LiveTrustStrip />
        <FeaturedTip onSendPrompt={sendPrompt} />
        <WhatHitaDoes />
        <ArticlesSection onSendPrompt={sendPrompt} />
        <ThingsToDo onSendPrompt={sendPrompt} />
        <HowItWorks />
        <BuiltDifferent />
        <MoreToExplore onSendPrompt={sendPrompt} />
        <WeekendGetaways onSendPrompt={sendPrompt} />
        <TopDestinations onSendPrompt={sendPrompt} />
        <NumbersThatMatter />
        <CtaBanner />
      </main>
      <HomeFooter />
    </div>
  );
}