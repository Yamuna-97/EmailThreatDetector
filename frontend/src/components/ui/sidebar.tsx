"use client";

import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

export interface Links {
  label: string;
  href?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  count?: number;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "h-screen sticky top-0 px-3 py-4 hidden md:flex md:flex-col bg-white border-r border-[#192837]/10 w-[270px] flex-shrink-0 z-30 shadow-xs",
        className
      )}
      animate={{
        width: animate ? (open ? "270px" : "68px") : "270px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-14 px-4 flex flex-row md:hidden items-center justify-between bg-white border-b border-[#192837]/10 w-full z-40"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <button
            type="button"
            className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-800 cursor-pointer"
            onClick={() => setOpen(!open)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-white p-6 z-[100] flex flex-col justify-between overflow-y-auto",
                className
              )}
            >
              <div
                className="absolute right-6 top-6 z-50 text-neutral-800 cursor-pointer p-2 rounded-full hover:bg-neutral-100"
                onClick={() => setOpen(!open)}
              >
                <X className="h-6 w-6" />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
} & React.HTMLAttributes<HTMLButtonElement | HTMLAnchorElement>) => {
  const { open, animate } = useSidebar();

  const content = (
    <>
      <div className={cn("shrink-0 flex items-center justify-center", link.active ? "text-[#7342E2]" : "text-[#192837]/70")}>
        {link.icon}
      </div>
      <motion.div
        animate={{
          display: animate ? (open ? "flex" : "none") : "flex",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="flex-1 flex items-center justify-between text-sm whitespace-pre overflow-hidden"
      >
        <span className={cn("font-medium transition duration-150 truncate", link.active ? "text-[#7342E2] font-bold" : "text-neutral-700")}>
          {link.label}
        </span>
        {link.count !== undefined && link.count > 0 && (
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full ml-1.5",
            link.active ? "bg-[#7342E2] text-white" : "bg-[#7342E2]/10 text-[#7342E2]"
          )}>
            {link.count}
          </span>
        )}
      </motion.div>
    </>
  );

  const baseClasses = cn(
    "flex items-center justify-start gap-3 group/sidebar py-2.5 px-3 rounded-2xl transition-all cursor-pointer w-full text-left",
    link.active
      ? "bg-[#7342E2]/10 text-[#7342E2] shadow-xs"
      : "hover:bg-[#FAF9F6] text-neutral-700 hover:text-[#192837]",
    className
  );

  if (link.onClick) {
    return (
      <button
        type="button"
        onClick={link.onClick}
        className={baseClasses}
        {...props}
      >
        {content}
      </button>
    );
  }

  return (
    <a
      href={link.href || "#"}
      className={baseClasses}
      {...(props as any)}
    >
      {content}
    </a>
  );
};
