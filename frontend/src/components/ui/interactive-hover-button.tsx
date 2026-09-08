import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  icon?: React.ReactNode;
}

const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ text, children, className, icon, ...props }, ref) => {
  const label = text || (typeof children === "string" ? children : "Button");

  return (
    <button
      ref={ref}
      className={cn(
        "group relative min-w-[8rem] px-5 py-2.5 cursor-pointer overflow-hidden rounded-full border border-[#2A2A2A] bg-[#181818] text-[#F5F5F5] text-center text-xs sm:text-sm font-semibold shadow-sm transition-all duration-300 hover:border-[#E50914] hover:shadow-md hover:shadow-[#E50914]/25 active:scale-95 flex items-center justify-center",
        className,
      )}
      {...props}
    >
      {/* Default State Content */}
      <span className="inline-flex items-center gap-2 translate-x-0 transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
        {icon}
        {children || label}
      </span>

      {/* Hover Reveal Content */}
      <div className="absolute top-0 left-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 text-white opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 font-bold px-3">
        <span className="truncate">{children || label}</span>
        <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
      </div>

      {/* Background Expand Bubble */}
      <div className="absolute left-[15%] top-[40%] h-2.5 w-2.5 scale-[1] rounded-full bg-[#E50914] transition-all duration-300 group-hover:left-[0%] group-hover:top-[0%] group-hover:h-full group-hover:w-full group-hover:scale-[1.8] group-hover:bg-[#E50914] group-hover:rounded-none"></div>
    </button>
  );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";

export { InteractiveHoverButton };
