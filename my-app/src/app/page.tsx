import Nav from "@/components/nav";
import { Body } from "@/components/ui-reservation/body";
import Footer from "@/components/footer";

export default function Home() {
  return (
  <>
    
      <div className="min-h-screen flex max-sm:items-center justify-center gap-10 flex-col">
            <Nav />
        
      
      <Body />
      
    </div>
    <Footer />
  </>
  );
}
