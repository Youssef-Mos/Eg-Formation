import Nav from "@/components/nav";
import { Body } from "@/components/ui-reservation/body";

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
