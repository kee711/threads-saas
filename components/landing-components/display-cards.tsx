"use client";

import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

interface DisplayCardProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  date?: string;
  iconClassName?: string;
  titleClassName?: string;
}

interface DisplayCardsProps {
  cards?: DisplayCardProps[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
  const displayCards = cards || [];

  return (
    <div className="relative grid [grid-area:'stack'] place-items-center opacity-100 animate-in fade-in-0 duration-700 min-h-[600px] sm:min-h-[580px] md:min-h-[660px] gap-y-12 sm:gap-y-10">
      {/* 타이틀 영역 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-0 flex flex-col items-center w-full pointer-events-none px-2 sm:px-0">
        <div className="text-xs sm:text-sm text-white/70 tracking-wide mb-2">Bring the power of automation to your social accounts</div>
        <div className="text-xl sm:text-2xl md:text-4xl font-bold text-white text-center mb-2 max-w-xs sm:max-w-xl md:max-w-2xl">Post made within a minute, <br />publish like a machine.</div>
        <span className="text-base sm:text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300 font-semibold mt-4">Your Words, Rapid Generation.</span>
      </div>

      {/* 카드 리스트 */}
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 items-center justify-center w-full max-w-6xl px-4 sm:px-0 mt-32 sm:mt-40 md:mt-48">
        {displayCards.map((cardProps, index) => (
          <Card
            key={index}
            variant="plus"
            title={cardProps.title}
            description={cardProps.description}
            className={cn(
              "w-full max-w-xs sm:max-w-sm md:max-w-md transition-all duration-1000 sm:duration-700 hover:-translate-y-2 hover:scale-105 bg-background/50 backdrop-blur-sm",
              cardProps.className
            )}
          />
        ))}
      </div>

      <div className="translate-y-4 sm:translate-y-10 text-base sm:text-xl md:text-2xl text-white/70 text-center tracking-tight px-2 sm:px-0">Salt AI's automated scheduler will assist you.</div>
    </div>
  );
}