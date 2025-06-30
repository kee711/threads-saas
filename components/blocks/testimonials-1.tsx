import { Card, CardHeader, CardFooter, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

export interface Testimonial {
  name: string;
  role: string;
  text: string;
  avatar: string;
  rating?: number;
}

interface TestimonialsSectionProps {
  title?: string;
  subtitle?: string;
  badgeText?: string;
  testimonials: Testimonial[];
}

export function TestimonialsSection({
  title = "Trusted by thousands of teams",
  subtitle = "See what our customers have to say about us.",
  badgeText = "Testimonials",
  testimonials,
}: TestimonialsSectionProps) {
  return (
    <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground dark:bg-primary dark:text-primary-foreground">
              {badgeText}
            </div>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight text-foreground dark:text-foreground">
              {title}
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-muted-foreground">
              {subtitle}
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-2">
          {testimonials.map((t, i) => {
            const stars = typeof t.rating === "number" ? t.rating : 0;
            return (
              <Card key={i} className="flex flex-col h-full bg-card dark:bg-card">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: stars }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`h-4 w-4 ${idx < stars
                            ? "fill-primary text-primary dark:fill-primary dark:text-primary"
                            : "text-muted fill-muted dark:text-muted dark:fill-muted"
                            }`}
                        />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground dark:text-muted-foreground">&ldquo;{t.text}&rdquo;</p>
                </CardContent>
                <CardFooter className="mt-auto">
                  <div className="flex items-center gap-4">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="rounded-xl w-8 h-8 object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground dark:text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export const sampleTestimonials = [
  {
    name: "Mittens Whiskerstein",
    role: "Chief Nap Officer",
    text: "I nap better knowing our data is safe with MeowCorp.",
    avatar: "https://example.com/kitty.jpg",
    rating: 5,
  },
  {
    name: "Woofy Barkwell",
    role: "Snack Acquisition Lead",
    text: "Thanks to MeowCorp, I finally outran the mailman.",
    avatar: "https://example.com/woof.jpg",
    rating: 4,
  },
];
