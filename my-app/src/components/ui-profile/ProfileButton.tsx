"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

interface ProfileButtonProps {
  username: string;
}

export default function ProfileButton({ username }: ProfileButtonProps) {
  const [hovered, setHovered] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    router.push("/profil");
  };

  return (
    <motion.div
      layout
      className="cursor-pointer inline-block overflow-hidden bg-zinc-800 px-2.5 py-2 rounded-lg shadow-md shadow-zinc-500 hover:shadow-lg hover:shadow-zinc-400 transition-all duration-300 ease-in-out"
      onClick={handleClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      transition={{ layout: { duration: 0.3 } }}
      style={{ display: "inline-flex", alignItems: "center" }} // Ensure proper alignment
    >
      <AnimatePresence mode="wait">
        {hovered ? (
          <motion.div
            key="hovered"
            layout
            className="flex items-center text-white whitespace-nowrap shadow-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <span>Consultez votre profil</span>
            <ArrowRight size={16} className="ml-1" />
          </motion.div>
        ) : (
          <motion.div
            key="default"
            layout
            className="text-white whitespace-nowrap shadow-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            Bonjour M.{username}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}