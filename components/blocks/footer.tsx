"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import {
  Blocks,
  CreditCard,
  Webhook,
  Handshake,
  Scale,
  Code as CodeXml,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Blocks,
  CreditCard,
  Webhook,
  Handshake,
  Scale,
  CodeXml,
};

interface SocialLink {
  name: string;
  href: string;
}

interface FooterLink {
  name: string;
  icon: string;
  href?: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface FooterProps extends React.HTMLAttributes<HTMLDivElement> {
  brand: {
    name: string;
    description: string;
  };
  socialLinks: SocialLink[];
  columns: FooterColumn[];
  copyright?: string;
}

export const Footer = React.forwardRef<HTMLDivElement, FooterProps>(
  ({ className, brand, socialLinks, columns, copyright, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("pt-24 bg-background", className)}
        {...props}
      >
        <div className="max-w-screen-xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <a href="#" className="text-xl font-semibold">
                {brand.name}
              </a>
              <p className="text-sm text-foreground/60">
                {brand.description}
              </p>

              <p className="text-sm font-light text-foreground/55 mt-3.5">
                {socialLinks.map((link, index) => (
                  <React.Fragment key={link.name}>
                    <a
                      className="hover:text-foreground/90"
                      target="_blank"
                      href={link.href}
                      rel="noopener noreferrer"
                    >
                      {link.name}
                    </a>
                    {index < socialLinks.length - 1 && " • "}
                  </React.Fragment>
                ))}
              </p>
            </div>

            <div className="grid grid-cols-2 mt-16 md:grid-cols-3 lg:col-span-8 lg:justify-items-end lg:mt-0">
              {columns.map(({ title, links }) => (
                <div key={title} className="last:mt-12 md:last:mt-0">
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <ul className="mt-4 space-y-2.5">
                    {links.map(({ name, icon, href }) => {
                      const IconComponent = ICONS[icon] || Blocks;

                      return (
                        <li key={name}>
                          <a
                            href={href || "#"}
                            className="text-sm transition-all text-foreground/60 hover:text-foreground/90 group"
                          >
                            <IconComponent className="inline stroke-2 h-4 mr-1.5 transition-all stroke-foreground/60 group-hover:stroke-foreground/90" />
                            {name}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {copyright && (
            <div className="mt-20 border-t pt-6 pb-8">
              <p className="text-xs text-foreground/55">{copyright}</p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

Footer.displayName = "Footer";