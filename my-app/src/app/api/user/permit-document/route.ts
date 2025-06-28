// app/api/user/permit-document/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withApiSecurity, logApiAccess } from "@/lib/apiSecurity";
import { put } from '@vercel/blob';

const prisma = new PrismaClient();

// Télécharger un document de permis (utilisateur)
export async function POST(request: NextRequest) {
  const { session, error } = await withApiSecurity(request, { 
    requireAuth: true 
  });
  
  if (error) {
    return error;
  }

  try {
    console.log('Début du traitement de l\'upload pour user ID:', session!.user.id);
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    console.log('Fichier reçu:', file ? file.name : 'null');
    console.log('Taille du fichier:', file ? file.size : 'N/A');
    console.log('Type du fichier:', file ? file.type : 'N/A');
    
    if (!file) {
      console.error('Aucun fichier dans FormData');
      logApiAccess(request, session, false, "NO_FILE_PROVIDED");
      return NextResponse.json(
        { error: "Aucun fichier fourni", code: "NO_FILE_PROVIDED" },
        { status: 400 }
      );
    }

    // Validation du fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      console.error('Type de fichier non autorisé:', file.type);
      logApiAccess(request, session, false, "INVALID_FILE_TYPE");
      return NextResponse.json(
        { error: "Type de fichier non autorisé. Utilisez JPG, PNG ou PDF", code: "INVALID_FILE_TYPE" },
        { status: 400 }
      );
    }

    if (file.size > maxSize) {
      console.error('Fichier trop volumineux:', file.size);
      logApiAccess(request, session, false, "FILE_TOO_LARGE");
      return NextResponse.json(
        { error: "Fichier trop volumineux (max 10MB)", code: "FILE_TOO_LARGE" },
        { status: 400 }
      );
    }

    console.log('Vérification des documents existants...');
    // Vérifier si l'utilisateur a déjà un document en attente ou vérifié
    const existingDocument = await prisma.permitDocument.findFirst({
      where: {
        userId: Number(session!.user.id),
        status: {
          in: ['pending', 'verified']
        }
      }
    });

    if (existingDocument) {
      console.log('Document existant trouvé:', existingDocument.status);
      logApiAccess(request, session, false, "DOCUMENT_ALREADY_EXISTS");
      return NextResponse.json(
        { 
          error: existingDocument.status === 'verified' 
            ? "Vous avez déjà un document vérifié" 
            : "Vous avez déjà un document en attente de vérification",
          code: "DOCUMENT_ALREADY_EXISTS" 
        },
        { status: 409 }
      );
    }

    // ✅ NOUVEAU : Upload vers Vercel Blob au lieu du système de fichiers
    const userId = session!.user.id;
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const blobFileName = `permit-documents/permit-${userId}-${timestamp}.${extension}`;

    console.log('Upload vers Vercel Blob:', blobFileName);

    // Upload du fichier vers Vercel Blob
    const blob = await put(blobFileName, file, {
      access: 'public', // ou 'private' selon vos besoins
      
    });

    console.log('Fichier uploadé vers Blob:', blob.url);

    console.log('Enregistrement en base de données...');
    // Enregistrer en base de données
    const permitDocument = await prisma.permitDocument.create({
      data: {
        userId: Number(userId),
        fileName: file.name,
        filePath: blob.url, // ✅ Stocker l'URL Blob au lieu du chemin local
        fileSize: file.size,
        fileType: file.type,
        status: 'pending'
      }
    });

    console.log('Document créé avec ID:', permitDocument.id);

    // Mettre à jour le statut de l'utilisateur
    await prisma.user.update({
      where: { id: Number(userId) },
      data: {
        permitDocumentUploaded: true,
        permitDocumentVerified: false
      }
    });

    // Créer une notification pour l'utilisateur
    await prisma.notification.create({
      data: {
        userId: Number(userId),
        type: 'permit_uploaded',
        title: 'Document de permis téléchargé',
        message: 'Votre document de permis a été téléchargé avec succès. Il sera vérifié sous 48h par notre équipe.',
        emailSent: false
      }
    });

    console.log('Upload terminé avec succès');
    logApiAccess(request, session, true);
    
    return NextResponse.json({
      success: true,
      message: "Document téléchargé avec succès",
      document: {
        id: permitDocument.id,
        fileName: permitDocument.fileName,
        status: permitDocument.status,
        createdAt: permitDocument.createdAt,
        url: blob.url // ✅ Retourner l'URL pour accès futur
      }
    });
    
  } catch (error) {
    console.error("Erreur lors du téléchargement:", error);
    logApiAccess(request, session, false, "UPLOAD_FAILED");
    
    return NextResponse.json(
      { 
        error: "Erreur serveur lors du téléchargement", 
        code: "UPLOAD_FAILED",
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Récupérer les documents de l'utilisateur connecté
export async function GET(request: NextRequest) {
  const { session, error } = await withApiSecurity(request, { 
    requireAuth: true 
  });
  
  if (error) {
    return error;
  }

  try {
    const documents = await prisma.permitDocument.findMany({
      where: {
        userId: Number(session!.user.id)
      },
      select: {
        id: true,
        fileName: true,
        filePath: true, // ✅ Maintenant c'est l'URL Blob
        status: true,
        adminComments: true,
        createdAt: true,
        verifiedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    logApiAccess(request, session, true);
    return NextResponse.json({
      success: true,
      documents
    });
    
  } catch (error) {
    console.error("Erreur lors de la récupération des documents:", error);
    logApiAccess(request, session, false, "FETCH_DOCUMENTS_FAILED");
    
    return NextResponse.json(
      { 
        error: "Erreur serveur lors de la récupération", 
        code: "FETCH_DOCUMENTS_FAILED" 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}