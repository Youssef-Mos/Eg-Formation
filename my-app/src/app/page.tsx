import Nav from "@/components/nav";
import { Body } from "@/components/ui-reservation/body";
import Footer from "@/components/footer";

export default function Home() {
  return (
  <>
    <div className="flex justify-center items-center flex-col gap-20 z-50">
      <Nav />
    
      <Body />
      
    </div>
    <Footer />
  </>
  );
}
