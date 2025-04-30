import React from "react";
import DeleteAccountDialog from "../Composant/Deleteaccount";

export default function Settings() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-4">Paramètres de compte</h1>
      <DeleteAccountDialog />
    </div>
  );
}   