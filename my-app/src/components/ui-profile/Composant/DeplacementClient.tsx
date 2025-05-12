'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';

interface DeplacementClientProps {
    user: { id: number; prenom: string; nom: string; email: string };
    fromStageId: number;
    stages: { id: number; Titre: string; PlaceDisponibles: number }[];
    refresh: () => void;
    setGlobalLoading: React.Dispatch<React.SetStateAction<boolean>>;
  }
  

export function DeplacementClient({ user, fromStageId, stages, refresh, setGlobalLoading }: DeplacementClientProps) {
  const [openDialog, setOpenDialog] = useState(false);
  const [targetStageId, setTargetStageId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDeplacement = async () => {
    if (!targetStageId) return;

    setLoading(true);

    try {
      const res = await fetch('/api/Stage/DeplacerReservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          fromStageId,
          toStageId: targetStageId,
        }),
      });

      if (res.ok) {
        toast.success('Client déplacé avec succès');
        refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors du déplacement');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur serveur');
    } finally {
        setOpenDialog(false);
        setGlobalLoading(true);
        setTimeout(() => {
          window.location.reload();
        }, 500); // laisse un petit délai pour que le squelette s'affiche
        
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="text-sm">Déplacer</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {stages
            .filter((s) => s.id !== fromStageId && s.PlaceDisponibles > 0)
            .map((s) => (
              <DropdownMenuItem
                key={s.id}
                onSelect={() => {
                  setTargetStageId(s.id);
                  setOpenDialog(true);
                }}
              >
                {s.Titre} ({s.PlaceDisponibles} places)
              </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={openDialog} onOpenChange={setOpenDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le déplacement</AlertDialogTitle>
            <AlertDialogDescription>
              Veux-tu vraiment déplacer <strong>{user.prenom} {user.nom}</strong> ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleDeplacement} disabled={loading}>
              {loading ? 'Déplacement...' : 'Confirmer'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
