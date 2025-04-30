"use client";

import { useSearchParams } from 'next/navigation';

export default function SuccessPage() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-2xl font-bold text-green-600">Paiement réussi !</h1>
      <p className="mt-4">Merci pour votre réservation.</p>
      {sessionId && <p className="mt-2 text-sm">Session ID : {sessionId}</p>}
    </div>
  );
}
