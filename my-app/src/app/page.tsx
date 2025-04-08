import Nav from "@/components/nav";
import { Body } from "@/components/ui-reservation/body";
import Footer from "@/components/footer";

export default function Home() {
  return (
  <>
    <div className="flex justify-center items-center flex-col gap-10 z-50">
      <div className="sticky top-0 z-50">
            <Nav />
        </div>
      
      <Body />
      
    </div>
    <Footer />
  </>
  );
}
