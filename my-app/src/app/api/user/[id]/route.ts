// app/api/user/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withApiSecurity, validateRequestData, validators, logApiAccess } from "@/lib/apiSecurity";

const prisma = new PrismaClient();

// ✅ MISE À JOUR : Validateur avec nouveaux champs de facturation et permis
const isValidUserData = (data: any): data is {
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  gender?: string;
  birthDate?: string;
  birthPlace?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  phone1?: string;
  phone2?: string;
  permitNumber?: string;
  permitIssuedAt?: string;
  permitDate?: string;
  role?: string;
  // ✅ NOUVEAUX CHAMPS DE FACTURATION
  useSameAddressForBilling?: boolean;
  billingAddress1?: string;
  billingAddress2?: string;
  billingAddress3?: string;
  billingPostalCode?: string;
  billingCity?: string;
  billingCountry?: string;
  // ✅ NOUVEAUX CHAMPS DE PERMIS
  permitDocumentUploaded?: boolean;
  permitDocumentVerified?: boolean;
  profileCompleted?: boolean;
} => {
  if (typeof data !== "object" || data === null) return false;
  
  // Validation des champs optionnels s'ils sont présents
  if (data.email && !validators.isValidEmail(data.email)) return false;
  if (data.postalCode && (typeof data.postalCode !== "string" || !/^\d{5}$/.test(data.postalCode))) return false;
  if (data.phone1 && (typeof data.phone1 !== "string" || !/^\d{10}$/.test(data.phone1.replace(/\s/g, '')))) return false;
  if (data.phone2 && (typeof data.phone2 !== "string" || !/^\d{10}$/.test(data.phone2.replace(/\s/g, '')))) return false;
  if (data.username && (typeof data.username !== "string" || data.username.trim().length < 3)) return false;
  
  // ✅ NOUVELLE VALIDATION : Champs de facturation
  if (data.useSameAddressForBilling !== undefined && typeof data.useSameAddressForBilling !== "boolean") return false;
  if (data.billingPostalCode && (typeof data.billingPostalCode !== "string" || !/^\d{5}$/.test(data.billingPostalCode))) return false;
  
  // ✅ NOUVELLE VALIDATION : Champs de permis
  if (data.permitDocumentUploaded !== undefined && typeof data.permitDocumentUploaded !== "boolean") return false;
  if (data.permitDocumentVerified !== undefined && typeof data.permitDocumentVerified !== "boolean") return false;
  if (data.profileCompleted !== undefined && typeof data.profileCompleted !== "boolean") return false;
  
  return true;
};

// Wrapper spécialisé pour les routes utilisateur avec vérification d'accès
async function withUserAuthAndParams(
  request: NextRequest,
  params: { id: string },
  handler: (request: NextRequest, context: { session: any; params: { id: string }; isOwnProfile: boolean; isAdmin: boolean }) => Promise<NextResponse>
) {
  const { session, error } = await withApiSecurity(request, { 
    requireAuth: true 
  });
  
  if (error) {
    return error;
  }

  const { id } = await params;
  const userId = Number(id);
  
  if (!validators.isValidId(userId)) {
    logApiAccess(request, session, false, "INVALID_USER_ID");
    return NextResponse.json(
      { error: "ID utilisateur invalide", code: "INVALID_USER_ID" },
      { status: 400 }
    );
  }

  const currentUserId = Number(session!.user.id);
  const isAdmin = session!.user.role === "admin";
  const isOwnProfile = currentUserId === userId;

  // Vérifier les autorisations : soit son propre profil, soit admin
  if (!isOwnProfile && !isAdmin) {
    logApiAccess(request, session, false, "ACCESS_FORBIDDEN");
    return NextResponse.json(
      { 
        error: "Accès refusé. Vous ne pouvez accéder qu'à votre propre profil.", 
        code: "ACCESS_FORBIDDEN" 
      },
      { status: 403 }
    );
  }
  
  return handler(request, { session: session!, params, isOwnProfile, isAdmin });
}

// ✅ MISE À JOUR : Récupérer un utilisateur avec toutes les nouvelles données
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withUserAuthAndParams(request, params, async (req, { session, params, isOwnProfile, isAdmin }) => {
    const userId = Number(params.id);

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          gender: true,
          birthDate: true,
          birthPlace: true,
          // Adresse principale
          address1: true,
          address2: true,
          address3: true,
          postalCode: true,
          city: true,
          country: true,
          phone1: true,
          phone2: true,
          permitNumber: true,
          permitIssuedAt: true,
          permitDate: true,
          username: true,
          role: true,
          createdAt: true,
          acceptTerms: true,
          acceptRules: true,
          confirmPointsCheck: true,
          // ✅ NOUVEAUX CHAMPS DE PERMIS
          permitDocumentUploaded: true,
          permitDocumentVerified: true,
          permitNotificationSent: true,
          profileCompleted: true,
          // ✅ NOUVEAUX CHAMPS DE FACTURATION
          useSameAddressForBilling: true,
          billingAddress1: true,
          billingAddress2: true,
          billingAddress3: true,
          billingPostalCode: true,
          billingCity: true,
          billingCountry: true,
          // Ne jamais retourner le mot de passe
        },
      });

      if (!user) {
        logApiAccess(req, session, false, "USER_NOT_FOUND");
        return NextResponse.json(
          { error: "Utilisateur non trouvé", code: "USER_NOT_FOUND" },
          { status: 404 }
        );
      }

      logApiAccess(req, session, true);
      return NextResponse.json(user);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      logApiAccess(req, session, false, "FETCH_FAILED");
      return NextResponse.json(
        { 
          error: "Erreur serveur lors de la récupération de l'utilisateur", 
          code: "FETCH_FAILED" 
        },
        { status: 500 }
      );
    }
  });
}

// ✅ MISE À JOUR : Mettre à jour un utilisateur avec toutes les nouvelles données
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withUserAuthAndParams(request, params, async (req, { session, params, isOwnProfile, isAdmin }) => {
    const userId = Number(params.id);

    // Validation des données
    const { data, error } = await validateRequestData(req, isValidUserData);
    if (error) {
      logApiAccess(req, session, false, "INVALID_USER_DATA");
      return error;
    }

    const userData = data!;

    try {
      // Sécurité : s'assurer qu'on ne peut pas changer le rôle sans être admin
      if (userData.role && !isAdmin) {
        delete userData.role;
        console.warn(`Tentative de modification de rôle par utilisateur non-admin: ${session.user.id}`);
      }

      // Sécurité : seuls les admins peuvent modifier les statuts de permis
      if (!isAdmin) {
        delete userData.permitDocumentUploaded;
        delete userData.permitDocumentVerified;
        delete userData.profileCompleted;
      }

      // Ne jamais permettre la modification du mot de passe via cette route
      if ('password' in userData) {
        delete (userData as any).password;
        console.warn(`Tentative de modification de mot de passe via route profil: ${session.user.id}`);
      }

      // Validation des données requises
      if (userData.email && !validators.isValidEmail(userData.email)) {
        logApiAccess(req, session, false, "INVALID_EMAIL");
        return NextResponse.json(
          { error: "Adresse email invalide", code: "INVALID_EMAIL" },
          { status: 400 }
        );
      }

      // ✅ NOUVELLE VALIDATION : Adresse de facturation
      if (userData.useSameAddressForBilling === false) {
        const billingRequiredFields = ['billingAddress1', 'billingPostalCode', 'billingCity'];
        
        for (const field of billingRequiredFields) {
          if (!userData[field as keyof typeof userData]) {
            logApiAccess(req, session, false, "MISSING_BILLING_FIELD");
            return NextResponse.json(
              { 
                error: `Le champ ${field} est requis quand une adresse de facturation différente est utilisée`, 
                code: "MISSING_BILLING_FIELD" 
              },
              { status: 400 }
            );
          }
        }
      }

      // Vérifier l'unicité de l'email
      if (userData.email) {
        const existingEmail = await prisma.user.findFirst({
          where: {
            email: userData.email,
            id: { not: userId },
          },
        });

        if (existingEmail) {
          logApiAccess(req, session, false, "EMAIL_EXISTS");
          return NextResponse.json(
            { 
              error: "Cet email est déjà utilisé par un autre compte", 
              code: "EMAIL_EXISTS" 
            },
            { status: 409 }
          );
        }
      }

      // Vérifier l'unicité du username
      if (userData.username) {
        const existingUsername = await prisma.user.findFirst({
          where: {
            username: userData.username,
            id: { not: userId },
          },
        });

        if (existingUsername) {
          logApiAccess(req, session, false, "USERNAME_EXISTS");
          return NextResponse.json(
            { 
              error: "Ce nom d'utilisateur est déjà utilisé", 
              code: "USERNAME_EXISTS" 
            },
            { status: 409 }
          );
        }
      }

      // Conversion des dates si nécessaire
      const dataToUpdate: any = { ...userData };
      if (dataToUpdate.birthDate) {
        dataToUpdate.birthDate = new Date(dataToUpdate.birthDate);
      }
      if (dataToUpdate.permitDate) {
        dataToUpdate.permitDate = new Date(dataToUpdate.permitDate);
      }

      // ✅ NOUVELLE LOGIQUE : Gestion des données de facturation
      if (dataToUpdate.useSameAddressForBilling === true) {
        // Si on utilise la même adresse, on vide les champs de facturation
        dataToUpdate.billingAddress1 = null;
        dataToUpdate.billingAddress2 = null;
        dataToUpdate.billingAddress3 = null;
        dataToUpdate.billingPostalCode = null;
        dataToUpdate.billingCity = null;
        dataToUpdate.billingCountry = null;
      }

      // Mettre à jour l'utilisateur
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          gender: true,
          birthDate: true,
          birthPlace: true,
          // Adresse principale
          address1: true,
          address2: true,
          address3: true,
          postalCode: true,
          city: true,
          country: true,
          phone1: true,
          phone2: true,
          permitNumber: true,
          permitIssuedAt: true,
          permitDate: true,
          username: true,
          role: true,
          createdAt: true,
          acceptTerms: true,
          acceptRules: true,
          confirmPointsCheck: true,
          // ✅ NOUVEAUX CHAMPS DE PERMIS
          permitDocumentUploaded: true,
          permitDocumentVerified: true,
          permitNotificationSent: true,
          profileCompleted: true,
          // ✅ NOUVEAUX CHAMPS DE FACTURATION
          useSameAddressForBilling: true,
          billingAddress1: true,
          billingAddress2: true,
          billingAddress3: true,
          billingPostalCode: true,
          billingCity: true,
          billingCountry: true,
        },
      });

      logApiAccess(req, session, true);
      return NextResponse.json({
        message: "Profil mis à jour avec succès",
        user: updatedUser
      });
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
      logApiAccess(req, session, false, "UPDATE_FAILED");
      
      // Gestion spécifique des erreurs Prisma
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0];
        return NextResponse.json(
          { 
            error: `Ce ${field === 'email' ? 'email' : 'nom d\'utilisateur'} est déjà utilisé`, 
            code: "DUPLICATE_FIELD" 
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { 
          error: "Erreur serveur lors de la mise à jour de l'utilisateur", 
          code: "UPDATE_FAILED" 
        },
        { status: 500 }
      );
    }
  });
}

// DELETE - Supprimer un utilisateur (Admin uniquement)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withUserAuthAndParams(request, params, async (req, { session, params, isOwnProfile, isAdmin }) => {
    // Seuls les admins peuvent supprimer des utilisateurs
    if (!isAdmin) {
      logApiAccess(req, session, false, "ADMIN_REQUIRED");
      return NextResponse.json(
        { 
          error: "Droits administrateur requis pour supprimer un utilisateur", 
          code: "ADMIN_REQUIRED" 
        },
        { status: 403 }
      );
    }

    const userId = Number(params.id);

    // Empêcher l'admin de se supprimer lui-même
    if (isOwnProfile) {
      logApiAccess(req, session, false, "CANNOT_DELETE_SELF");
      return NextResponse.json(
        { 
          error: "Vous ne pouvez pas supprimer votre propre compte", 
          code: "CANNOT_DELETE_SELF" 
        },
        { status: 400 }
      );
    }

    try {
      // Vérifier si l'utilisateur a des réservations
      const reservationsCount = await prisma.reservation.count({
        where: { userId }
      });

      if (reservationsCount > 0) {
        logApiAccess(req, session, false, "USER_HAS_RESERVATIONS");
        return NextResponse.json(
          { 
            error: "Impossible de supprimer un utilisateur avec des réservations actives", 
            code: "USER_HAS_RESERVATIONS",
            reservationsCount 
          },
          { status: 409 }
        );
      }

      // Supprimer l'utilisateur (les documents et notifications seront supprimés en cascade grâce à onDelete: Cascade)
      const deletedUser = await prisma.user.delete({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          username: true
        }
      });

      logApiAccess(req, session, true);
      return NextResponse.json({
        message: "Utilisateur supprimé avec succès",
        deletedUser
      });
    } catch (error: any) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      logApiAccess(req, session, false, "DELETE_FAILED");
      
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: "Utilisateur non trouvé", code: "USER_NOT_FOUND" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          error: "Erreur serveur lors de la suppression de l'utilisateur", 
          code: "DELETE_FAILED" 
        },
        { status: 500 }
      );
    }
  });
}