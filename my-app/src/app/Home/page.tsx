import React from "react";
import Nav from "@/components/nav";
import { Background } from "@/components/background";
import { LampDemo } from "@/components/Home/head-body";
import Footer from "@/components/footer";
import BodyHome from "@/components/Home/body";

export default function Accueil() {
    return (
        <>
        
        <div className="flex  items-center  flex-col gap-5 h-screen z-50">
        <div className="fixed top-0 z-50">
            <Nav />
        </div>
        <div className="">
        <LampDemo />
        </div>
        <div className="flex flex-col items-center gap-10  justify-center w-screen">
            <BodyHome />
            
        </div>
        <div className=" bottom-0 w-screen "><Footer /></div>
        
        </div>
        </>
    )
    }