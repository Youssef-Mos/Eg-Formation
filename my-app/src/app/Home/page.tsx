import React from "react";
import Nav from "@/components/nav";
import { Background } from "@/components/background";
import { LampDemo } from "@/components/Home/head-body";
import Footer from "@/components/footer";
import BodyHome from "@/components/Home/body";

export default function Accueil() {
    return (
        <>
        
        <div className="min-h-screen flex max-sm:items-center justify-center gap-5 flex-col">
            <Nav />
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