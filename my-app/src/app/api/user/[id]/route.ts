// app/api/user/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// Récupérer un utilisateur
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  // Vérifier l'authentification et les autorisations
  if (!session || !session.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  
  // Un utilisateur ne peut accéder qu'à son propre profil (sauf admin)
  if (session.user.id !== params.id && session.user.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(params.id) },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        gender: true,
        birthDate: true,
        birthPlace: true,
        address1: true,
        address2: true,
        address3: true,
        postalCode: true,
        city: true,
        phone1: true,
        phone2: true,
        permitNumber: true,
        permitIssuedAt: true,
        permitDate: true,
        username: true,
        role: true,
        createdAt: true,
        // Ne pas retourner le mot de passe
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération de l'utilisateur" },
      { status: 500 }
    );
  }
}

// Mettre à jour un utilisateur
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  // Vérifier l'authentification et les autorisations
  if (!session || !session.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  
  // Un utilisateur ne peut modifier que son propre profil (sauf admin)
  if (session.user.id !== params.id && session.user.role !== "admin") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const userData = await request.json();
    
    // Sécurité : s'assurer qu'on ne peut pas changer le rôle
    if (userData.role && session.user.role !== "admin") {
      delete userData.role;
    }
    
    // Ne jamais permettre la modification du mot de passe via cette route
    if (userData.password) {
      delete userData.password;
    }

    // Validation des données (exemple simple, à adapter selon vos besoins)
    if (!userData.email || !userData.username) {
      return NextResponse.json(
        { error: "Email et nom d'utilisateur sont requis" },
        { status: 400 }
      );
    }

    // Vérifier si l'email ou le username existent déjà pour un autre utilisateur
    if (userData.email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: userData.email,
          id: { not: Number(params.id) },
        },
      });

      if (existingEmail) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé par un autre compte" },
          { status: 400 }
        );
      }
    }

    if (userData.username) {
      const existingUsername = await prisma.user.findFirst({
        where: {
          username: userData.username,
          id: { not: Number(params.id) },
        },
      });

      if (existingUsername) {
        return NextResponse.json(
          { error: "Ce nom d'utilisateur est déjà utilisé" },
          { status: 400 }
        );
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: Number(params.id) },
      data: userData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        // Ne pas retourner le mot de passe
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la mise à jour de l'utilisateur" },
      { status: 500 }
    );
  }
}