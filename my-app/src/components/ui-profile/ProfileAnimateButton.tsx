"use client";
import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

export function AnimatedProfileButton() {
  const { data: session } = useSession();

  return (
    <Link href="/profil">
      <motion.button
        className={cn(
          "bg-black dark:bg-white dark:text-black text-white flex justify-center items-center group relative overflow-hidden rounded-md px-4 py-2 cursor-pointer hover:shadow-lg hover:shadow-zinc-400 transition-all duration-300 ease-in"
        )}
      >
        <motion.span className="transition duration-500 group-hover:translate-x-40">
          {session?.user.username || "Profile"}
        </motion.span>
        <motion.div className="absolute inset-0 flex items-center justify-center -translate-x-40 transition duration-500 group-hover:translate-x-0 z-20">
          {/* Icône de profil */}
          👤
        </motion.div>
      </motion.button>
    </Link>
  );
}
