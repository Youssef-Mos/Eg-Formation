// app/api/admin/client/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withApiSecurity, validators, logApiAccess } from "@/lib/apiSecurity";

const prisma = new PrismaClient();

// Récupérer un client spécifique avec tous ses détails (Admin uniquement)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await withApiSecurity(request, { 
    requireAuth: true,
    requireAdmin: true 
  });
  
  if (error) {
    return error;
  }

  const { id } = await params;
  const clientId = Number(id);
  
  if (!validators.isValidId(clientId)) {
    logApiAccess(request, session, false, "INVALID_CLIENT_ID");
    return NextResponse.json(
      { error: "ID client invalide", code: "INVALID_CLIENT_ID" },
      { status: 400 }
    );
  }

  try {
    const client = await prisma.user.findUnique({
      where: {
        id: clientId,
        role: "client" // S'assurer que c'est bien un client
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        gender: true,
        birthDate: true,
        birthPlace: true,
        phone1: true,
        phone2: true,
        // Adresse principale
        address1: true,
        address2: true,
        address3: true,
        postalCode: true,
        city: true,
        country: true,
        // Informations de permis
        permitNumber: true,
        permitIssuedAt: true,
        permitDate: true,
        permitDocumentUploaded: true,
        permitDocumentVerified: true,
        permitNotificationSent: true,
        profileCompleted: true,
        // Adresse de facturation
        useSameAddressForBilling: true,
        billingAddress1: true,
        billingAddress2: true,
        billingAddress3: true,
        billingPostalCode: true,
        billingCity: true,
        billingCountry: true,
        // Métadonnées
        createdAt: true,
        acceptTerms: true,
        acceptRules: true,
        confirmPointsCheck: true,
        // Relations
        reservations: {
          select: {
            id: true,
            createdAt: true,
            paid: true,
            paymentMethod: true,
            TypeStage: true,
            stage: {
              select: {
                id: true,
                Titre: true,
                DateDebut: true,
                DateFin: true,
                Prix: true,
                Adresse: true,
                CodePostal: true,
                Ville: true,
                PlaceDisponibles: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        permitDocuments: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            status: true,
            adminComments: true,
            createdAt: true,
            verifiedAt: true,
            verifiedBy: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            currency: true,
            status: true,
            createdAt: true,
            dueDate: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        notifications: {
          select: {
            id: true,
            type: true,
            title: true,
            message: true,
            read: true,
            emailSent: true,
            createdAt: true,
            readAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 20 // Limiter aux 20 dernières notifications
        }
      }
    });

    if (!client) {
      logApiAccess(request, session, false, "CLIENT_NOT_FOUND");
      return NextResponse.json(
        { error: "Client non trouvé", code: "CLIENT_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Calculer des statistiques supplémentaires
    const stats = {
      totalReservations: client.reservations.length,
      paidReservations: client.reservations.filter(r => r.paid).length,
      unpaidReservations: client.reservations.filter(r => !r.paid).length,
      totalSpent: client.reservations
        .filter(r => r.paid)
        .reduce((sum, r) => sum + r.stage.Prix, 0),
      totalInvoices: client.invoices.length,
      paidInvoices: client.invoices.filter(i => i.status === 'paid').length,
      pendingInvoices: client.invoices.filter(i => i.status === 'pending').length,
      unreadNotifications: client.notifications.filter(n => !n.read).length,
      documentsCount: client.permitDocuments.length,
      verifiedDocuments: client.permitDocuments.filter(d => d.status === 'verified').length,
      pendingDocuments: client.permitDocuments.filter(d => d.status === 'pending').length,
      rejectedDocuments: client.permitDocuments.filter(d => d.status === 'rejected').length,
      accountAge: Math.floor((new Date().getTime() - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24)) // en jours
    };

    logApiAccess(request, session, true);
    
    return NextResponse.json({
      client,
      stats
    });
    
  } catch (error) {
    console.error("Erreur lors de la récupération du client:", error);
    logApiAccess(request, session, false, "FETCH_CLIENT_FAILED");
    
    return NextResponse.json(
      { 
        error: "Erreur serveur lors de la récupération du client", 
        code: "FETCH_CLIENT_FAILED" 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Mettre à jour un client (Admin uniquement)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await withApiSecurity(request, { 
    requireAuth: true,
    requireAdmin: true 
  });
  
  if (error) {
    return error;
  }

  const { id } = await params;
  const clientId = Number(id);
  
  if (!validators.isValidId(clientId)) {
    logApiAccess(request, session, false, "INVALID_CLIENT_ID");
    return NextResponse.json(
      { error: "ID client invalide", code: "INVALID_CLIENT_ID" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    
    // Validation des champs autorisés pour la modification par admin
    const allowedFields = [
      'firstName', 'lastName', 'email', 'username', 'gender', 'birthDate', 'birthPlace',
      'address1', 'address2', 'address3', 'postalCode', 'city', 'country',
      'phone1', 'phone2', 'permitNumber', 'permitIssuedAt', 'permitDate',
      'useSameAddressForBilling', 'billingAddress1', 'billingAddress2', 'billingAddress3',
      'billingPostalCode', 'billingCity', 'billingCountry',
      'permitDocumentUploaded', 'permitDocumentVerified', 'profileCompleted',
      'acceptTerms', 'acceptRules', 'confirmPointsCheck'
    ];

    const updateData: any = {};
    
    // Filtrer les champs autorisés
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Conversion des dates si nécessaire
    if (updateData.birthDate) {
      updateData.birthDate = new Date(updateData.birthDate);
    }
    if (updateData.permitDate) {
      updateData.permitDate = new Date(updateData.permitDate);
    }

    // Vérifier que le client existe
    const existingClient = await prisma.user.findUnique({
      where: { 
        id: clientId,
        role: "client"
      }
    });

    if (!existingClient) {
      logApiAccess(request, session, false, "CLIENT_NOT_FOUND");
      return NextResponse.json(
        { error: "Client non trouvé", code: "CLIENT_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Vérifier l'unicité de l'email
    if (updateData.email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: updateData.email,
          id: { not: clientId },
        },
      });

      if (existingEmail) {
        logApiAccess(request, session, false, "EMAIL_EXISTS");
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
    if (updateData.username) {
      const existingUsername = await prisma.user.findFirst({
        where: {
          username: updateData.username,
          id: { not: clientId },
        },
      });

      if (existingUsername) {
        logApiAccess(request, session, false, "USERNAME_EXISTS");
        return NextResponse.json(
          { 
            error: "Ce nom d'utilisateur est déjà utilisé", 
            code: "USERNAME_EXISTS" 
          },
          { status: 409 }
        );
      }
    }

    // Mettre à jour le client
    const updatedClient = await prisma.user.update({
      where: { id: clientId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        profileCompleted: true,
        permitDocumentUploaded: true,
        permitDocumentVerified: true
      }
    });

    // Log de l'action admin
    await prisma.notification.create({
      data: {
        userId: clientId,
        type: 'profile_updated_by_admin',
        title: 'Profil mis à jour par un administrateur',
        message: `Votre profil a été mis à jour par un administrateur (${session?.user?.email ?? 'admin'}).`,
        emailSent: false
      }
    });

    logApiAccess(request, session, true);
    
    return NextResponse.json({
      message: "Client mis à jour avec succès",
      client: updatedClient
    });
    
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour du client:", error);
    logApiAccess(request, session, false, "UPDATE_CLIENT_FAILED");
    
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
        error: "Erreur serveur lors de la mise à jour du client", 
        code: "UPDATE_CLIENT_FAILED" 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Supprimer un client (Admin uniquement)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await withApiSecurity(request, { 
    requireAuth: true,
    requireAdmin: true 
  });
  
  if (error) {
    return error;
  }

  const { id } = await params;
  const clientId = Number(id);
  
  if (!validators.isValidId(clientId)) {
    logApiAccess(request, session, false, "INVALID_CLIENT_ID");
    return NextResponse.json(
      { error: "ID client invalide", code: "INVALID_CLIENT_ID" },
      { status: 400 }
    );
  }

  try {
    // Vérifier que le client existe
    const existingClient = await prisma.user.findUnique({
      where: { 
        id: clientId,
        role: "client"
      },
      include: {
        reservations: true,
        invoices: true
      }
    });

    if (!existingClient) {
      logApiAccess(request, session, false, "CLIENT_NOT_FOUND");
      return NextResponse.json(
        { error: "Client non trouvé", code: "CLIENT_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Vérifier si le client a des réservations payées
    const paidReservations = existingClient.reservations.filter(r => r.paid);
    if (paidReservations.length > 0) {
      logApiAccess(request, session, false, "CLIENT_HAS_PAID_RESERVATIONS");
      return NextResponse.json(
        { 
          error: "Impossible de supprimer un client avec des réservations payées", 
          code: "CLIENT_HAS_PAID_RESERVATIONS",
          paidReservationsCount: paidReservations.length
        },
        { status: 409 }
      );
    }

    // Supprimer le client (cascade automatique pour les documents, notifications, etc.)
    const deletedClient = await prisma.user.delete({
      where: { id: clientId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true
      }
    });

    logApiAccess(request, session, true);
    
    return NextResponse.json({
      message: "Client supprimé avec succès",
      deletedClient
    });
    
  } catch (error: any) {
    console.error("Erreur lors de la suppression du client:", error);
    logApiAccess(request, session, false, "DELETE_CLIENT_FAILED");
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Client non trouvé", code: "CLIENT_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: "Erreur serveur lors de la suppression du client", 
        code: "DELETE_CLIENT_FAILED" 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}