// app/inscription-redirect/page.tsx

import { Suspense } from "react";
import RedirectPageContent from "./redirect-content";

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement...</p>
      </div>
    </div>
  );
}

export default function RedirectPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RedirectPageContent />
    </Suspense>
  );
}