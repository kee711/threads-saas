"use client"

import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const tabsTriggerVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-muted text-muted-foreground hover:text-primary",
                active: "bg-background text-primary shadow",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

const Tabs = TabsPrimitive.Root
const TabsList = TabsPrimitive.List
const TabsTrigger = TabsPrimitive.Trigger

export { Tabs, TabsList, TabsTrigger, tabsTriggerVariants }
