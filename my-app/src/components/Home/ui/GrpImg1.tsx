"use client";
import { motion } from "motion/react";
import React from "react";
import { ImagesSlider } from "./image-slider";
 
export function ImagesSliderDemo1() {
  const images = [
    "/image/image6.jpg",
    "/image/image4.jpg",
  ];

    return (
        <div className="flex items-center justify-center w-full h-full">
        <ImagesSlider
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
        </ImagesSlider>
        </div>
    );
}