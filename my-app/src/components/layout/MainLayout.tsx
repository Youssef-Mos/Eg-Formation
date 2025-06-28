// components/layout/MainLayout.tsx
"use client";

import React from "react";
import { useSession } from "next-auth/react";
import PermitNotificationBanner from "../ui-profile/Composant/PermitNotif";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification de permis manquant pour les clients */}
      {status === "authenticated" && session?.user?.role === "client" && (
        <PermitNotificationBanner />
      )}
      
      {/* Contenu principal */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

// Hook pour vérifier le statut du permis
export function usePermitStatus() {
  const { data: session } = useSession();
  const [permitStatus, setPermitStatus] = React.useState({
    uploaded: false,
    verified: false,
    profileCompleted: false,
    loading: true
  });

  React.useEffect(() => {
    if (session?.user?.id && session?.user?.role === "client") {
      fetchPermitStatus();
    } else {
      setPermitStatus(prev => ({ ...prev, loading: false }));
    }
  }, [session]);

  const fetchPermitStatus = async () => {
    try {
      const res = await fetch(`/api/user/${session?.user.id}`);
      if (res.ok) {
        const userData = await res.json();
        setPermitStatus({
          uploaded: userData.permitDocumentUploaded || false,
          verified: userData.permitDocumentVerified || false,
          profileCompleted: userData.profileCompleted || false,
          loading: false
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du statut du permis:', error);
      setPermitStatus(prev => ({ ...prev, loading: false }));
    }
  };

  return { ...permitStatus, refetch: fetchPermitStatus };
}