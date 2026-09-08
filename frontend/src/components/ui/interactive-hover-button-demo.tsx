import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

export function InteractiveHoverButtonDemo() {
  return (
    <div className="relative flex flex-wrap gap-4 items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
      <InteractiveHoverButton text="Get Started" />
      <InteractiveHoverButton text="Launch Scan" className="bg-[#7342E2]/10 border-[#7342E2]" />
      <InteractiveHoverButton text="SOC Console" />
    </div>
  );
}

export default InteractiveHoverButtonDemo;
