// app/api/admin/clients/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withApiSecurity, logApiAccess } from "@/lib/apiSecurity";

const prisma = new PrismaClient();

// Récupérer tous les clients (Admin uniquement)
export async function GET(request: NextRequest) {
  const { session, error } = await withApiSecurity(request, { 
    requireAuth: true,
    requireAdmin: true 
  });
  
  if (error) {
    return error;
  }

  try {
    // Récupérer les paramètres de recherche et pagination
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const status = searchParams.get('status'); // all, complete, incomplete, verified, unverified
    
    // Construire la condition WHERE
    const whereCondition: any = {
      role: "client"
    };

    // Ajouter la recherche textuelle
    if (search) {
      whereCondition.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { phone1: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtrer par statut
    switch (status) {
      case 'complete':
        whereCondition.profileCompleted = true;
        break;
      case 'incomplete':
        whereCondition.profileCompleted = false;
        break;
      case 'verified':
        whereCondition.permitDocumentVerified = true;
        break;
      case 'unverified':
        whereCondition.permitDocumentUploaded = false;
        break;
    }

    // Calculer l'offset pour la pagination
    const offset = (page - 1) * limit;

    // Définir l'ordre de tri
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Récupérer les clients avec pagination
    const [clients, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereCondition,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          username: true,
          phone1: true,
          phone2: true,
          address1: true,
          address2: true,
          address3: true,
          postalCode: true,
          city: true,
          country: true,
          birthDate: true,
          birthPlace: true,
          gender: true,
          permitNumber: true,
          permitIssuedAt: true,
          permitDate: true,
          permitDocumentUploaded: true,
          permitDocumentVerified: true,
          permitNotificationSent: true,
          profileCompleted: true,
          useSameAddressForBilling: true,
          billingAddress1: true,
          billingAddress2: true,
          billingAddress3: true,
          billingPostalCode: true,
          billingCity: true,
          billingCountry: true,
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
                  Titre: true,
                  DateDebut: true,
                  DateFin: true,
                  Prix: true
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
              status: true,
              createdAt: true
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
              status: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          },
          notifications: {
            where: {
              read: false
            },
            select: {
              id: true,
              type: true
            }
          }
        },
        orderBy,
        skip: offset,
        take: limit
      }),
      prisma.user.count({
        where: whereCondition
      })
    ]);

    // Calculer des statistiques globales
    const stats = await prisma.user.aggregate({
      where: { role: "client" },
      _count: {
        id: true
      }
    });

    const profileStats = await prisma.user.groupBy({
      by: ['profileCompleted', 'permitDocumentUploaded', 'permitDocumentVerified'],
      where: { role: "client" },
      _count: {
        id: true
      }
    });

    // Transformer les statistiques
    const globalStats = {
      totalClients: stats._count.id,
      completeProfiles: profileStats.filter(s => s.profileCompleted).reduce((sum, s) => sum + s._count.id, 0),
      incompleteProfiles: profileStats.filter(s => !s.profileCompleted).reduce((sum, s) => sum + s._count.id, 0),
      uploadedDocuments: profileStats.filter(s => s.permitDocumentUploaded).reduce((sum, s) => sum + s._count.id, 0),
      verifiedDocuments: profileStats.filter(s => s.permitDocumentVerified).reduce((sum, s) => sum + s._count.id, 0),
      unverifiedDocuments: profileStats.filter(s => s.permitDocumentUploaded && !s.permitDocumentVerified).reduce((sum, s) => sum + s._count.id, 0)
    };

    // Calculer les métadonnées de pagination
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const pagination = {
      currentPage: page,
      totalPages,
      totalCount,
      hasNextPage,
      hasPrevPage,
      limit
    };

    logApiAccess(request, session, true);
    
    return NextResponse.json({
      clients,
      pagination,
      stats: globalStats
    });
    
  } catch (error) {
    console.error("Erreur lors de la récupération des clients:", error);
    logApiAccess(request, session, false, "FETCH_CLIENTS_FAILED");
    
    return NextResponse.json(
      { 
        error: "Erreur serveur lors de la récupération des clients", 
        code: "FETCH_CLIENTS_FAILED" 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Créer un nouveau client (Admin uniquement)
export async function POST(request: NextRequest) {
  const { session, error } = await withApiSecurity(request, { 
    requireAuth: true,
    requireAdmin: true 
  });
  
  if (error) {
    return error;
  }

  try {
    const body = await request.json();
    
    // Validation des champs requis
    const requiredFields = [
      'firstName', 'lastName', 'email', 'username', 'birthDate', 'birthPlace',
      'address1', 'postalCode', 'city', 'phone1', 'permitNumber', 'permitIssuedAt'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Le champ ${field} est requis`, code: "MISSING_REQUIRED_FIELD" },
          { status: 400 }
        );
      }
    }

    // Vérifier l'unicité de l'email
    const existingEmail = await prisma.user.findUnique({
      where: { email: body.email }
    });

    if (existingEmail) {
      logApiAccess(request, session, false, "EMAIL_EXISTS");
      return NextResponse.json(
        { error: "Cet email est déjà utilisé", code: "EMAIL_EXISTS" },
        { status: 409 }
      );
    }

    // Vérifier l'unicité du username
    const existingUsername = await prisma.user.findUnique({
      where: { username: body.username }
    });

    if (existingUsername) {
      logApiAccess(request, session, false, "USERNAME_EXISTS");
      return NextResponse.json(
        { error: "Ce nom d'utilisateur est déjà utilisé", code: "USERNAME_EXISTS" },
        { status: 409 }
      );
    }

    // Créer un mot de passe temporaire
    const bcrypt = require('bcrypt');
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Préparer les données de facturation
    const billingData = body.useSameAddressForBilling ? {
      useSameAddressForBilling: true,
      billingAddress1: null,
      billingAddress2: null,
      billingAddress3: null,
      billingPostalCode: null,
      billingCity: null,
      billingCountry: null,
    } : {
      useSameAddressForBilling: false,
      billingAddress1: body.billingAddress1,
      billingAddress2: body.billingAddress2 || null,
      billingAddress3: body.billingAddress3 || null,
      billingPostalCode: body.billingPostalCode,
      billingCity: body.billingCity,
      billingCountry: body.billingCountry || 'FR',
    };

    // Créer le client
    const newClient = await prisma.user.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        username: body.username,
        password: hashedPassword,
        role: "client",
        gender: body.gender || "male",
        birthDate: new Date(body.birthDate),
        birthPlace: body.birthPlace,
        address1: body.address1,
        address2: body.address2 || null,
        address3: body.address3 || null,
        postalCode: body.postalCode,
        city: body.city,
        country: body.country || "FR",
        phone1: body.phone1,
        phone2: body.phone2 || null,
        permitNumber: body.permitNumber,
        permitIssuedAt: body.permitIssuedAt,
        permitDate: new Date(body.permitDate || new Date()),
        ...billingData,
        acceptTerms: true,
        acceptRules: true,
        confirmPointsCheck: true,
        permitDocumentUploaded: false,
        permitDocumentVerified: false,
        profileCompleted: false
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        createdAt: true
      }
    });

    // Créer une notification de bienvenue
    await prisma.notification.create({
      data: {
        userId: newClient.id,
        type: 'account_created_by_admin',
        title: 'Compte créé par un administrateur',
        message: `Bonjour ${newClient.firstName} ${newClient.lastName},\n\nVotre compte EG-Formation a été créé par un administrateur.\n\nVos identifiants temporaires :\nEmail : ${newClient.email}\nMot de passe : ${tempPassword}\n\nVeuillez vous connecter et modifier votre mot de passe.\n\nCordialement,\nL'équipe EG-Formation`,
        emailSent: false
      }
    });

    logApiAccess(request, session, true);
    
    return NextResponse.json({
      message: "Client créé avec succès",
      client: newClient,
      tempPassword // Uniquement pour l'admin
    }, { status: 201 });
    
  } catch (error: any) {
    console.error("Erreur lors de la création du client:", error);
    logApiAccess(request, session, false, "CREATE_CLIENT_FAILED");
    
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
        error: "Erreur serveur lors de la création du client", 
        code: "CREATE_CLIENT_FAILED" 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}