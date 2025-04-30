// components/ui-profile/SidebarDemo.tsx
"use client";
import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";
import { IconArrowLeft, IconBrandTabler, IconSettings, IconUserBolt } from "@tabler/icons-react";
import MesReservations from "@/components/ui-profile/SlideBarCompo/MesReservation";
import Settings from "@/components/ui-profile/SlideBarCompo/parametre";
import ProfilePro from "@/components/ui-profile/SlideBarCompo/Profile-profile";
import { motion } from "framer-motion";
import Link from 'next/link';
import HistoriqueResa from "../ui-profile/SlideBarCompo/HisotoriquesResa";

// ReservationLinkAdmin.tsx
export const ReservationLinkAdmin = (setSelectedTab: any, setOpen: any) => ({
  label: "Historique des réservations",
  icon: <IconBrandTabler className="h-5 w-5" />,
  onClick: () => {
    setSelectedTab("reservations");
    setOpen(false);
  },
});

// ReservationLinkUser.tsx
export const ReservationLinkUser = (setSelectedTab: any, setOpen: any) => ({
  label: "Mes réservations",
  icon: <IconBrandTabler className="h-5 w-5" />,
  onClick: () => {
    setSelectedTab("reservations");
    setOpen(false);
  },
});


function SidebarLogo() {
  const { open } = useSidebar();
  return (
    <div className="mb-6 text-nowrap">
  <motion.div
    initial={false}
    animate={{ opacity: 1, width: open ? "auto" : "auto" }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className="flex items-center gap-2 py-1 overflow-hidden whitespace-nowrap text-nowrap text-black dark:text-white"
  >
    <Link href="/" className="text-nowrap flex items-center gap-2 text-lg font-bold text-black dark:text-white">
      <div className="h-5 w-6 bg-black dark:bg-white rounded" />
      <motion.span
        initial={false}
        animate={{ opacity: open ? 1 : 0, x: open ? 5 : 10 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="font-medium text-nowrap"
      >
        <span className="text-nowrap">
        Eg-Formation
        </span>
      </motion.span>
    </Link>
  </motion.div>
</div>

  );
}

export function SidebarDemo() {
  const { data: session } = useSession();
  const reservationLabel = session?.user?.role === "admin"
    ? "Historique des réservations"
    : "Mes réservations";

  const [open, setOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"historique"|"reservations"|"profile"|"settings">("reservations");

  const links = [
    session?.user?.role === "admin"
    ? {
        label: "Historique des réservations",
        href: "#",
        icon: <IconBrandTabler className="h-5 w-5" />,
        onClick: () => {
          setSelectedTab("historique");
           if (typeof window !== "undefined" && window.innerWidth < 768) {
      setOpen(false);
    }
        },
      }
    : {
        label: "Mes réservations",
        href: "#",
        icon: <IconBrandTabler className="h-5 w-5" />,
        onClick: () => {
          setSelectedTab("reservations");
           if (typeof window !== "undefined" && window.innerWidth < 768) {
      setOpen(false);
    }
        },
      },



    {
      label: "Profile",
      href: "#",
      icon: <IconUserBolt className="h-5 w-5" />,
      onClick: () => {setSelectedTab("profile")
         if (typeof window !== "undefined" && window.innerWidth < 768) {
      setOpen(false);
    }
      },
    },
    {
      label: "Settings",
      href: "#",
      icon: <IconSettings className="h-5 w-5" />,
      onClick: () => {setSelectedTab("settings")
         if (typeof window !== "undefined" && window.innerWidth < 768) {
      setOpen(false);
    }

      },
    },
    {
      label: "Se déconnecter",
      href: "#",
      icon: <IconArrowLeft className="h-5 w-5" />,
      onClick: async (e:any) => {
        e.preventDefault();
        await signOut({ callbackUrl: "/" });
      },
    },
  ];

  return (
    <div className="flex h-screen">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody>
          <SidebarLogo />
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>
        </SidebarBody>
      </Sidebar>
  
      <main className="flex-1 p-6 overflow-auto">
        {selectedTab === "reservations" && session?.user?.role !== "admin" && <MesReservations />}
        {selectedTab === "historique" && session?.user?.role === "admin" && <HistoriqueResa />}
        {selectedTab === "profile" && <ProfilePro />}
        {selectedTab === "settings" && <Settings />}
      </main>
    
    </div>
  );
}
