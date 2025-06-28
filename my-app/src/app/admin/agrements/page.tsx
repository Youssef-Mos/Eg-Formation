// app/admin/agrements/page.tsx
'use client';

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import AgrementManagement from "@/components/admin/AgrementManagement";

export default function AgrementsPage() {
  const router = useRouter();

  return (
    <AuthGuard requireAuth={true} requireAdmin={true}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Navigation */}
          <div className="mb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2 h-10 border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
          </div>

          {/* Composant de gestion des agréments */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <AgrementManagement />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}