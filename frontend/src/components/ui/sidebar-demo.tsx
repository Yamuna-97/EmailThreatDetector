"use client";
import { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { LayoutDashboard, UserCog, Settings, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CyberTraceLogoIcon } from "../CyberTraceLogo";

export function SidebarDemo() {
  const links = [
    {
      label: "Dashboard",
      href: "#",
      icon: (
        <LayoutDashboard className="text-neutral-700 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Profile",
      href: "#",
      icon: (
        <UserCog className="text-neutral-700 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Settings",
      href: "#",
      icon: (
        <Settings className="text-neutral-700 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Logout",
      href: "#",
      icon: (
        <LogOut className="text-neutral-700 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        "rounded-2xl flex flex-col md:flex-row bg-[#FAF9F6] w-full flex-1 max-w-7xl mx-auto border border-[#192837]/10 overflow-hidden",
        "h-[60vh]"
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: "Security Analyst",
                href: "#",
                icon: (
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    className="h-7 w-7 flex-shrink-0 rounded-full object-cover"
                    alt="Avatar"
                  />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      <Dashboard />
    </div>
  );
}

export const Logo = () => {
  return (
    <div className="font-normal flex space-x-2.5 items-center text-sm text-[#192837] py-1 relative z-20">
      <CyberTraceLogoIcon size={32} className="shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-extrabold text-base text-[#192837] whitespace-pre font-heading"
      >
        Cyber<span className="text-[#7342E2]">Trace</span>
      </motion.span>
    </div>
  );
};

export const LogoIcon = () => {
  return (
    <div className="font-normal flex space-x-2 items-center text-sm text-[#192837] py-1 relative z-20">
      <CyberTraceLogoIcon size={32} className="shrink-0" />
    </div>
  );
};

const Dashboard = () => {
  return (
    <div className="flex flex-1">
      <div className="p-4 md:p-8 rounded-tl-3xl border-l border-[#192837]/10 bg-white flex flex-col gap-4 flex-1 w-full h-full">
        <div className="flex gap-3">
          {[...new Array(4)].map((_, i) => (
            <div
              key={"first-array" + i}
              className="h-24 w-full rounded-2xl bg-[#FAF9F6] border border-[#192837]/5 animate-pulse"
            />
          ))}
        </div>
        <div className="flex gap-3 flex-1">
          {[...new Array(2)].map((_, i) => (
            <div
              key={"second-array" + i}
              className="h-full w-full rounded-2xl bg-[#FAF9F6] border border-[#192837]/5 animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
