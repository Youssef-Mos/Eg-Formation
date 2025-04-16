import React from "react";
import Nav from "@/components/nav";

export default function MesReservations() {
    return (
        <>
            <div className="flex justify-center items-center  flex-col gap-10 z-50">
                <div className="sticky top-0 z-50">
                    <Nav />
                </div>
                <div className="flex mt-10 justify-center px-3 py-4 flex-col gap-4 border-2 rounded-2xl shadow-lg shadow-zinc-300 border-zinc-900 hover:shadow-xl hover:shadow-zinc-300 transition-all duration-200 ease-in w-md md:w-lg lg:w-4xl xl:w-6xl">
                    <h1 className="text-3xl max-md:text-2xl font-bold mb-4  text-center">Mes réservations</h1>
                    <h2 className="text-lg max-md:text-sm mb-5 text-center">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</h2>
                </div>
            </div>
        </>
    )
}
