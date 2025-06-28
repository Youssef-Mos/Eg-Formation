'use client';
import React, { useState } from "react";
import { motion } from "framer-motion";

interface MotionHoverCardProps {
  children: React.ReactNode;
}

export function MotionHoverCard({ children }: MotionHoverCardProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div 
      className="relative overflow-hidden" 
      onMouseMove={handleMouseMove}
      style={{ cursor: "pointer" }}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.3), transparent 70%)`,
        }}
        transition={{ duration: 0.2 }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
