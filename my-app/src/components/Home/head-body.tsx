"use client";
import React from "react";
import { motion } from "motion/react";
import { LampContainer } from "../ui/lamp";
import { Background } from "../background";

export function LampDemo() {
  return (
    <LampContainer>
    
      <motion.h1
        initial={{ opacity: 0.5, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="mt-8 bg-gradient-to-br from-red-400 to-blue-400 py-4 bg-clip-text text-center text-4xl font-medium tracking-tight text-transparent md:text-7xl"
      >
        <span className="text-blue-400">Eg-Fo</span><span className="text-gray-300">rmat</span><span className="text-red-400">ions</span> <br /> Récupère tes points rapidement
      </motion.h1>
    </LampContainer>
  );
}
