'use client';

import { Footer } from "@/components/blocks/footer";
import React from "react";
import { Sparkles } from "lucide-react";
import dynamic from 'next/dynamic';

/* Design Components */
import { HeroGeometric } from "@/components/landing-components/shape-landing-hero"
import { Feature } from "@/components/landing-components/feature-with-image-comparison";

const BackgroundPaths = dynamic(
  () => import('@/components/landing-components/modern-background-paths'),
  { ssr: false }
);

import InteractiveHero from "@/components/blocks/hero-section-nexus";
import { TestimonialsSection, sampleTestimonials } from "@/components/blocks/testimonials-1";
import { PricingModal } from "@/components/modals/PricingModal";
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/landing-components/stepper";

const steps = [
  {
    step: 1,
    title: "Step One",
    description: "Desc for step one",
  },
  {
    step: 2,
    title: "Step Two",
    description: "Desc for step two",
  },
  {
    step: 3,
    title: "Step Three",
    description: "Desc for step three",
  },
];


// app/page.tsx
export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pricingModalOpen, setPricingModalOpen] = useState(false);

  // Check for pricing modal parameter
  useEffect(() => {
    const modal = searchParams.get('modal');
    if (modal === 'pricing') {
      setPricingModalOpen(true);
    }
  }, [searchParams]);

  const handleClosePricingModal = () => {
    setPricingModalOpen(false);
    // Remove the modal parameter from URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('modal');
    router.replace(newUrl.pathname + newUrl.search);
  };

  return (
    <div className="dark bg-background landing-page">
      <HeroGeometric badge="Salt AI"
        title1="No More"
        title2="Shit AI's writing." />

      <div className="relative flex flex-col items-center justify-center w-full py-20">
        <div className="flex flex-col items-center max-w-6xl mx-auto px-4 sm:px-6 w-full">
          {/* 타이틀 영역 */}
          <div className="text-center mb-16">
            {/* <div className="text-xs sm:text-sm text-white/70 tracking-wide mb-2">
              Bring the power of automation to your social accounts
            </div>
            <div className="text-xl sm:text-2xl md:text-4xl font-bold text-white text-center mb-4 max-w-xs sm:max-w-xl md:max-w-2xl mx-auto">
              Post made within a minute,<br />publish like a machine.
            </div> */}
            <span className="text-base sm:text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300 font-semibold">
              Key Features
            </span>
            <div className="text-base sm:text-lg md:text-xl text-white/70 mt-6 leading-relaxed font-light tracking-tight max-w-xl mx-auto px-4">
              Bring the power of automation to your social accounts
            </div>
          </div>
        </div>
      </div>

      {/* Feature Sections */}
      <div className="w-full space-y-32">
        {/* First Feature - Left GIF, Right Text */}
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
            {/* MOV Section */}
            <div className="w-full md:w-1/2">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black/20 border border-white/10">
                <video
                  src="/media_contents/vid_create-detail.mov"
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>
            </div>
            {/* Text Section */}
            <div className="w-full md:w-1/2 space-y-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                Topic Finder
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 mt-1 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                  </div>
                  <p className="text-lg text-gray-300">Explore ideas, perfectly suitable for you</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 mt-1 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                  </div>
                  <p className="text-lg text-gray-300">Obviously, up-to-date topics are here</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 mt-1 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                  </div>
                  <p className="text-lg text-gray-300">Personal profile data makes topic more yours</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Second Feature - Right GIF, Left Text */}
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col-reverse md:flex-row items-center gap-8 md:gap-16">
            {/* Text Section */}
            <div className="w-full md:w-1/2 space-y-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                Detail Writer
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 mt-1 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                  </div>
                  <p className="text-lg text-gray-300">Need more info? Salt AI searches online and provides details</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 mt-1 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                  </div>
                  <p className="text-lg text-gray-300">Your writing style is being trained to your personal SaltAI model</p>
                </div>
              </div>
            </div>
            {/* MOV Section */}
            <div className="w-full md:w-1/2">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black/20 border border-white/10">
                <video
                  src="/media_contents/vid_topic-finder.mov"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col items-center justify-center py-16 sm:py-20">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300 mb-4">
          Built for Productivity
        </h2>
        <h3 className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8">Leverage the AI, make authentic stories reveil.</h3>
      </div>

      <BackgroundPaths />
      {/* <Feature /> */}
      {/* <InteractiveHero /> */}
      {/* <TestimonialsSection testimonials={sampleTestimonials} /> */}

      <Footer
        brand={{
          name: "webtics",
          description: "Track and monitor your website traffic.",
        }}
        socialLinks={[
          {
            name: "Twitter",
            href: "https://x.com/raymethula",
          },
          {
            name: "Github",
            href: "https://github.com/serafimcloud",
          },
          {
            name: "Discord",
            href: "#",
          },
        ]}
        columns={[
          {
            title: "Product",
            links: [
              {
                name: "Features",
                icon: "Blocks",
                href: "#features",
              },
              {
                name: "Pricing",
                icon: "CreditCard",
                href: "#pricing",
              },
              {
                name: "Integrations",
                icon: "Webhook",
                href: "#integrations",
              },
              {
                name: "API Documentation",
                icon: "CodeXml",
                href: "/docs/api",
              },
            ],
          },
          {
            title: "Legal",
            links: [
              {
                name: "Privacy Policy",
                icon: "Scale",
                href: "/legal/privacy",
              },
              {
                name: "Terms of Service",
                icon: "Handshake",
                href: "/legal/terms",
              },
            ],
          },
        ]}
        copyright="webtics Inc. © 2024"
      />

      {/* Pricing Modal */}
      <PricingModal
        open={pricingModalOpen}
        onClose={handleClosePricingModal}
      />
    </div>
  );
}