import Nav from "@/components/nav";
import { Body } from "@/components/body";

export default function Home() {
  return (
  <>
    <div className="flex justify-center items-center flex-col gap-20 ">
      <Nav />
    
      <Body />
    </div>
  
  </>
  );
}
