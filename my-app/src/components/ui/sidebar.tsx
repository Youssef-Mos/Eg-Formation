// components/ui/sidebar.tsx
'use client';
import React, { useState, createContext, useContext } from "react";
import Link, { LinkProps } from "next/link";
import { AnimatePresence, motion, Variants } from "motion/react";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element;
  onClick?: (e: React.MouseEvent) => void;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);
export const useSidebar = () => {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = setOpenProp ?? setOpenState;
  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}) => (
  <SidebarProvider open={open} setOpen={setOpen}>{children}</SidebarProvider>
);

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => (
  <>
    <DesktopSidebar {...props} />
    <MobileSidebar {...(props as React.ComponentProps<"div">)} />
  </>
);

const sidebarVariants: Variants = {
  open: { width: "300px", transition: { duration: 0.3, ease: "easeInOut" } },
  closed: { width: "60px", transition: { duration: 0.3, ease: "easeInOut" } },
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen } = useSidebar();
  return (
    <motion.div
      className={cn(
        "h-full px-4 py-4 hidden md:flex md:flex-col bg-neutral-100 dark:bg-neutral-800 shrink-0",
        className
      )}
      variants={sidebarVariants}
      initial="closed"
      animate={open ? "open" : "closed"}
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
    <div
      className={cn("h-10 px-4 py-4 flex rounded-br-2xl hover:bg-neutral-300 transition-all duration-200 ease-in  items-center justify-between md:hidden bg-neutral-200 dark:bg-neutral-800", className)}
      {...props}
    >
      <IconMenu2 onClick={() => setOpen(!open)} className="text-neutral-800 dark:text-neutral-200 cursor-pointer" />
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 bg-white dark:bg-neutral-900 p-10 z-50 flex flex-col"
          >
            <IconX onClick={() => setOpen(false)} className="absolute right-10 top-6 text-neutral-800 dark:text-neutral-200 cursor-pointer" />
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
  props?: LinkProps;
}) => {
  const { open } = useSidebar();
  return (
    <Link
      href={link.href}
      onClick={link.onClick}
      className={cn(
        "flex items-center gap-3 py-2 px-3 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors",
        className
      )}
      {...props}
    >
    <motion.div
      animate={{ x: open ? 0 : -10 }}
      whileHover={open ? { x: 4 } : undefined}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="flex justify-center gap-10 flex-shrink-0"
    >
      {link.icon}
    
    <span
      style={{ width: open ? "auto" : 0 }}
      className=" overflow-hidden whitespace-pre text-neutral-700 dark:text-neutral-200 text-sm"
    >
      {link.label}
    </span>
    </motion.div>
  </Link>
  );
};
