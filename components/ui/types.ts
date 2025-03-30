import { ButtonHTMLAttributes } from "react";
import { VariantProps } from "class-variance-authority";
import { buttonVariants } from "./button";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export type ToastProps = {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
}

export type SidebarNavItem = {
  title: string;
  href: string;
  icon?: React.ElementType;
  disabled?: boolean;
  external?: boolean;
  label?: string;
} 