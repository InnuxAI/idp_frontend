"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const categoryBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        custom: "border-transparent text-black font-semibold"
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface CategoryBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof categoryBadgeVariants> {
  color?: string
}

function CategoryBadge({ className, variant = "custom", color, style, ...props }: CategoryBadgeProps) {
  const customStyle = color && variant === "custom" 
    ? { 
        backgroundColor: color, 
        borderColor: color,
        color: '#000000', // Black text
        fontWeight: '600', // Semi-bold for better readability
        ...style 
      } 
    : style;

  return (
    <div 
      className={cn(categoryBadgeVariants({ variant }), className)} 
      style={customStyle}
      {...props} 
    />
  )
}

export { CategoryBadge, categoryBadgeVariants }
