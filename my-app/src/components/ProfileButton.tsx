"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
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
      className="cursor-pointer inline-block bg-white rounded-lg px-2.5 py-2 z-20 "
      onClick={handleClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <AnimatePresence mode="wait">
        {hovered ? (
          <motion.div
            key="hovered"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex items-cente  text-white"
          >
            <span>Consultez votre profil</span>
            <ArrowRight size={16} className="ml-1" />
          </motion.div>
        ) : (
          <motion.div
            key="default"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-white"
          >
            Bonjour M.{username}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
