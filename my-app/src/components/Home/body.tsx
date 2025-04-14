import React from "react";
import AnimatedCard from "../ui/animatedCard";
import AnimatedSection from "../ui/AnimatedSection";



export default function BodyHome () {
    return (
        <>
        <AnimatedSection>
        <div className="flex max-md:flex-col gap-10 xl:text-lg xl:gap-20">
            <AnimatedCard delay={100}>
            <div className="relative gap-3 h-max rounded-2xl flex flex-col justify-center items-center py-2 px-3 text-center  lg:w-xs w-52 text-sm lg:text-md xl:text-lg border-2 shadow-lg inset-shadow-2xs inset-shadow-zinc-400 shadow-cyan-900 border-zinc-900 "><span className="font-bold text-xl lg:text-2xl">Titre1</span>Lorem ipsum dolor sit amet consectetur adipisicing elit. Facilis facere molestias porro! Corrupti blanditiis soluta aliquid! Deserunt sunt cupiditate provident autem veritatis ducimus atque dolor fuga inventore tempora, voluptate quo.</div>
            </AnimatedCard>
            <AnimatedCard delay={200}>
            <div className="relative translate-y-10 gap-3 rounded-2xl h-max flex flex-col justify-center items-center py-2 px-3 lg:w-xs w-52 text-sm lg:text-md xl:text-lg border-2 shadow-lg inset-shadow-2xs inset-shadow-zinc-400 shadow-zinc-700 border-zinc-900 text-center"><span className="font-bold text-xl lg:text-2xl">Titre2</span>Lorem ipsum dolor sit amet consectetur adipisicing elit. Reprehenderit, repellendus similique rerum temporibus nemo tenetur corporis sit enim ipsum delectus tempora quo sint perspiciatis, est ut suscipit adipisci deserunt doloremque!</div>
            </AnimatedCard>
            <AnimatedCard delay={300}>
            <div className="relative translate-y-20 mb-16 gap-3 flex flex-col rounded-2xl justify-center items-center py-2 px-3  lg:w-xs w-52 text-sm lg:text-md xl:text-lg border-2 border-zinc-900 shadow-lg inset-shadow-2xs inset-shadow-zinc-400 shadow-red-900 text-center"><span className="font-bold text-xl lg:text-2xl">Titre3</span>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Quidem reprehenderit at fugit rem eos, voluptatem suscipit eaque repudiandae porro. Repellendus dolore totam praesentium amet dignissimos animi voluptate, impedit incidunt officiis.</div>
            </AnimatedCard>

        </div>
        </AnimatedSection>
        
        <div className="flex w-full  ml-20 justify-baseline items-start">
        <AnimatedSection>
            <AnimatedCard delay={400}>
        <div className="flex gap-7 items-center justify-start w-md lg:w-3xl rounded-2xl mt-10 h-96 border-2 border-zinc-900">
            <div className="w-80 h-64 rounded-2xl border-2 ml-10">

            </div>
            <div className="w-96 border-2 mr-7">Lorem ipsum dolor sit, amet consectetur adipisicing elit. Iusto commodi sunt doloribus similique temporibus laboriosam. Unde adipisci ipsam culpa quis tenetur aliquid, optio vero quaerat placeat, reiciendis consectetur, dolores deleniti.</div>
        </div>
        </AnimatedCard>
        </AnimatedSection>
        </div>
        

        <div className="flex w-full  mr-20 justify-end items-start">
        <AnimatedSection>
            <AnimatedCard delay={500}>
            <div className="flex items-center justify-end w-md lg:w-3xl rounded-2xl mt-10 h-96 border-2 border-zinc-900">
            <div className="w-80 h-64 rounded-2xl border-2 ml-10">

            </div>
            <div className="w-96 border-2 mx-7">Lorem ipsum dolor sit, amet consectetur adipisicing elit. Iusto commodi sunt doloribus similique temporibus laboriosam. Unde adipisci ipsam culpa quis tenetur aliquid, optio vero quaerat placeat, reiciendis consectetur, dolores deleniti.</div></div>
            </AnimatedCard>
        </AnimatedSection>
        </div>

        <div className="flex w-full  ml-20 justify-baseline items-start">
            <AnimatedSection>
            <AnimatedCard delay={600}>
<div className="flex items-center justify-end w-md lg:w-3xl rounded-2xl mt-10 h-96 border-2 border-zinc-900">
        <div className="w-80 h-64 rounded-2xl border-2 ml-10">

        </div>
        <div className="w-96 border-2 mx-7">Lorem ipsum dolor sit, amet consectetur adipisicing elit. Iusto commodi sunt doloribus similique temporibus laboriosam. Unde adipisci ipsam culpa quis tenetur aliquid, optio vero quaerat placeat, reiciendis consectetur, dolores deleniti.</div></div>
            </AnimatedCard>
        </AnimatedSection>
        </div>
        </>
    )
}
