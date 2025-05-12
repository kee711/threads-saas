import { Footer } from "@/components/blocks/footer";
import InteractiveHero from "@/components/blocks/hero-section-nexus";
import { TestimonialsSection, sampleTestimonials } from "@/components/blocks/testimonials-1";

// app/page.tsx
export default function Home() {
  return (
    <div className="dark bg-background landing-page">
      <InteractiveHero />
      <TestimonialsSection testimonials={sampleTestimonials} />
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
    </div>
  );
}