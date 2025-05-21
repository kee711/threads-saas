"use client";

import * as React from "react";
import { cn } from "@/lib/utils"; // You'll need this utility for class merging

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    isLoading?: boolean;
    children?: React.ReactNode;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
    ({ className, isLoading = true, children, ...props }, ref) => {
        if (!isLoading) return <>{children}</>;

        return (
            <div
                ref={ref}
                className={cn(
                    "animate-pulse rounded-md bg-muted", // Default styles
                    className
                )}
                {...props}
            >
                {/* Empty div that will be styled as the skeleton */}
                <div className="invisible">{children}</div>
            </div>
        );
    }
);
Skeleton.displayName = "Skeleton";

export { Skeleton };