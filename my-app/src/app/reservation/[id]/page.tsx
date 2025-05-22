import ReservationFormClient from "@/components/ui-reservation/ReservationPayement";
import { notFound } from "next/navigation";

async function getStage(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/Stage/RecupStage`, {
    next: { revalidate: 60 }
  });
  if (!res.ok) {
    throw new Error("Erreur lors de la récupération du stage");
  }
  const stages = await res.json();
  return stages.find((s: any) => s.id === Number(id));
}



export default async function ReservationPage({ params }: { params: { id: string } }) {

  const { id } = await params;
  const stage = await getStage(id);
  if (!stage) notFound();

  return (
    <div className="container mx-auto p-4">
      <ReservationFormClient stage={stage} />
    </div>
  );
}
