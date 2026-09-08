import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Links {
  label: string;
  href?: string;
  icon: React.JSX.Element | React.ReactNode;
  active?: boolean;
  count?: number;
  onClick?: () => void;
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
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
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
      <MobileSidebar {...(props as unknown as React.ComponentProps<"div">)} />
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
        "h-screen sticky top-0 px-3 py-5 hidden md:flex md:flex-col flex-shrink-0 z-30 transition-colors",
        "bg-[var(--bg-secondary)] border-r border-[var(--border-primary)]",
        "shadow-[1px_0_16px_rgba(0,0,0,0.15)]",
        className
      )}
      animate={{
        width: animate ? (open ? "264px" : "68px") : "264px",
      }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
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
          "h-14 px-4 flex flex-row md:hidden items-center justify-between w-full z-40 transition-colors",
          "bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <button
            type="button"
            className="p-2 rounded-xl hover:bg-[var(--surface-raised)] text-[var(--color-text-secondary)] hover:text-[#FF1E2D] transition-all cursor-pointer"
            onClick={() => setOpen(!open)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "fixed h-full w-full inset-0 bg-[var(--bg-secondary)] p-6 z-[100] flex flex-col justify-between overflow-y-auto",
                "border-r border-[var(--border-primary)]",
                className
              )}
            >
              <div
                className="absolute right-5 top-5 z-50 text-[var(--color-text-secondary)] cursor-pointer p-2 rounded-xl hover:bg-[var(--surface-raised)] hover:text-[#FF1E2D] transition-all"
                onClick={() => setOpen(!open)}
              >
                <X className="h-5 w-5" />
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
      {/* Icon wrapper */}
      <div
        className={cn(
          "shrink-0 flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-150",
          link.active
            ? "bg-[#E50914] text-white shadow-[0_2px_10px_rgba(229,9,20,0.4)]"
            : "text-[var(--color-text-muted)] group-hover/sidebar:text-[var(--color-text-primary)] group-hover/sidebar:bg-[var(--surface-raised)]"
        )}
      >
        {link.icon}
      </div>

      {/* Label + count */}
      <motion.div
        animate={{
          display: animate ? (open ? "flex" : "none") : "flex",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        transition={{ duration: 0.18 }}
        className="flex-1 flex items-center justify-between overflow-hidden"
      >
        <span
          className={cn(
            "text-sm whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-150",
            link.active
              ? "text-[var(--color-text-primary)] font-bold"
              : "text-[var(--color-text-secondary)] font-medium group-hover/sidebar:text-[var(--color-text-primary)]"
          )}
        >
          {link.label}
        </span>
        {link.count !== undefined && link.count > 0 && (
          <span
            className={cn(
              "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ml-2 shrink-0 transition-colors",
              link.active
                ? "bg-[#E50914] text-white"
                : "bg-[var(--surface-raised)] text-[var(--color-text-secondary)] border border-[var(--border-primary)]"
            )}
          >
            {link.count}
          </span>
        )}
      </motion.div>
    </>
  );

  const baseClasses = cn(
    "flex items-center gap-2.5 group/sidebar py-1.5 px-2 rounded-xl transition-all duration-150 cursor-pointer w-full text-left",
    link.active
      ? "bg-[var(--surface-interactive)] border-l-2 border-[#E50914]"
      : "hover:bg-[var(--surface-raised)]",
    className
  );

  if (link.href) {
    return (
      <a
        href={link.href}
        onClick={link.onClick}
        className={baseClasses}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={link.onClick}
      className={baseClasses}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  );
};
