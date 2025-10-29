import * as React from "react"
import { cn } from "@/lib/utils/cn"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          // Chrome autocomplete fix - prevents white background on autofilled textareas
          "[&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_hsl(var(--input))]",
          "[&:-webkit-autofill]:[-webkit-text-fill-color:hsl(var(--foreground))]",
          "[&:-webkit-autofill:hover]:shadow-[inset_0_0_0_1000px_hsl(var(--input))]",
          "[&:-webkit-autofill:focus]:shadow-[inset_0_0_0_1000px_hsl(var(--input))]",
          "[&:-webkit-autofill:active]:shadow-[inset_0_0_0_1000px_hsl(var(--input))]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
