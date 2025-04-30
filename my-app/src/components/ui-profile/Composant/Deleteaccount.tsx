"use client";

import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";


export default function DeleteAccountDialog() {
  const router = useRouter();

  const handleDelete = async () => {
    try {
      const res = await fetch("/api/user/delete", {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Échec de la suppression");

      // ↓ Vide la session NextAuth et redirige vers l'accueil
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      console.error(err);
      toast.error("Impossible de supprimer le compte");
    }
  };


  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="cursor-pointer" variant="destructive">Supprimer mon compte</Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Confirmer la suppression de votre compte
          </AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible : toutes vos données seront définitivement effacées.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
