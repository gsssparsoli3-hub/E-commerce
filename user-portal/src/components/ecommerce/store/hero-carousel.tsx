"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouterStore } from "@/stores/router";
import type { Banner } from "@/types";

export function HeroCarousel({ banners }: { banners: Banner[] }) {
  const navigate = useRouterStore((s) => s.navigate);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (paused || banners.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [paused, banners.length]);

  if (banners.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden rounded-2xl border bg-muted"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 50) {
          setIndex((i) =>
            dx < 0 ? (i + 1) % banners.length : (i - 1 + banners.length) % banners.length
          );
        }
        touchStartX.current = null;
      }}
      aria-roledescription="carousel"
      aria-label="Featured promotions"
    >
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {banners.map((banner, i) => (
          <div key={banner.id} className="relative min-w-full">
            <div className="relative aspect-[21/9] w-full sm:aspect-[21/8] lg:aspect-[21/7]">
              <img
                src={banner.image}
                alt={banner.title}
                className="absolute inset-0 h-full w-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/10" />
              <div className="relative z-10 flex h-full max-w-xl flex-col justify-center gap-2 p-6 text-white sm:gap-3 sm:p-12">
                <h2 className="text-2xl font-extrabold leading-tight tracking-tight drop-shadow sm:text-4xl">
                  {banner.title}
                </h2>
                {banner.subtitle && (
                  <p className="max-w-md text-sm text-white/90 drop-shadow sm:text-base">{banner.subtitle}</p>
                )}
                {banner.ctaText && (
                  <Button
                    size="lg"
                    className="mt-2 w-fit rounded-full"
                    onClick={() => navigate(banner.link ?? "/shop")}
                  >
                    {banner.ctaText}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      {banners.length > 1 && (
        <>
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-3 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 rounded-full bg-background/70 backdrop-blur hover:bg-background sm:inline-flex"
            onClick={() => setIndex((index - 1 + banners.length) % banners.length)}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-3 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 rounded-full bg-background/70 backdrop-blur hover:bg-background sm:inline-flex"
            onClick={() => setIndex((index + 1) % banners.length)}
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5" role="tablist" aria-label="Slides">
            {banners.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === index}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
