"use client";
import React, { useState } from "react";

import { SidebarDemo } from "@/components/ui/ProfileSidebar";
import AuthGuard from "@/components/auth/AuthGuard";

export default function Profile() {
  return (
    <AuthGuard requireAuth={true}>
    <div className="flex h-screen flex-col">
      <SidebarDemo />
    </div>

    </AuthGuard>
  )
}