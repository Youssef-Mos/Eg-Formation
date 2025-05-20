"use client";
import { motion } from "motion/react";
import React from "react";
import { ImagesSlider2 } from "./image-slider copy 2";
 
export function ImagesSliderDemo3() {
  const images = [
    "/image/image2.jpg",
    "/image/image5.jpg",
  ];

    return (
        <div className="flex items-center justify-center w-full h-full">
        <ImagesSlider2
            images={images}
            autoplay={true}
            overlayClassName="bg-black/50"
            className="w-full h-full rounded-2xl border-1"
        >
            <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <h1 className="text-white text-2xl font-bold">Welcome to the Slider</h1>
            </motion.div>
        </ImagesSlider2>
        </div>
    );
}