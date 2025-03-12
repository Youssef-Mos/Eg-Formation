import Nav from "@/components/nav";
import { Body } from "@/components/body";

export default function Home() {
  return (
  <>
  <div className="flex justify-center items-center h-screen flex-col gap-5">
    <Nav />
    <Body />

  </div>
  </>
  );
}
