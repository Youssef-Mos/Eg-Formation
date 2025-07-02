// app/api/admin/permit-documents/[id]/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withApiSecurity, validators, logApiAccess } from "@/lib/apiSecurity";

const prisma = new PrismaClient();

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
  const documentId = Number(id);
  
  if (!validators.isValidId(documentId)) {
    logApiAccess(request, session, false, "INVALID_DOCUMENT_ID");
    return NextResponse.json(
      { error: "ID de document invalide", code: "INVALID_DOCUMENT_ID" },
      { status: 400 }
    );
  }

  try {
    console.log(`🔍 Recherche du document ID: ${documentId}`);
    
    // Récupérer le document depuis la base de données
    const document = await prisma.permitDocument.findUnique({
      where: { id: documentId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!document) {
      console.error(`❌ Document ${documentId} non trouvé`);
      logApiAccess(request, session, false, "DOCUMENT_NOT_FOUND");
      return NextResponse.json(
        { error: "Document non trouvé", code: "DOCUMENT_NOT_FOUND" },
        { status: 404 }
      );
    }

    console.log(`✅ Document trouvé: ${document.fileName}`);
    console.log(`📍 URL Blob: ${document.filePath}`);

    // ✅ TÉLÉCHARGEMENT DIRECT : Proxy du fichier depuis Vercel Blob
    if (document.filePath.startsWith('https://')) {
      console.log(`📥 Téléchargement direct depuis Blob: ${document.filePath}`);
      
      try {
        // Récupérer le fichier depuis Vercel Blob
        const blobResponse = await fetch(document.filePath);
        
        if (!blobResponse.ok) {
          console.error(`❌ Erreur lors de la récupération du blob: ${blobResponse.status}`);
          logApiAccess(request, session, false, "BLOB_FETCH_ERROR");
          return NextResponse.json(
            { error: "Erreur lors de la récupération du fichier", code: "BLOB_FETCH_ERROR" },
            { status: 500 }
          );
        }

        // Convertir en buffer pour le téléchargement
        const blob = await blobResponse.blob();
        const buffer = await blob.arrayBuffer();

        console.log(`✅ Fichier récupéré: ${buffer.byteLength} bytes`);
        
        // Nettoyer le nom de fichier pour le téléchargement
        const safeFileName = document.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const userPrefix = document.user ? `${document.user.lastName}_${document.user.firstName}_` : '';
        const downloadFileName = `${userPrefix}${safeFileName}`;

        logApiAccess(request, session, true);
        
        // Retourner le fichier comme téléchargement direct
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': document.fileType || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${downloadFileName}"`,
            'Content-Length': buffer.byteLength.toString(),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
        });
        
      } catch (fetchError) {
        console.error(`❌ Erreur lors du fetch du blob:`, fetchError);
        logApiAccess(request, session, false, "BLOB_FETCH_FAILED");
        return NextResponse.json(
          { 
            error: "Impossible de récupérer le fichier", 
            code: "BLOB_FETCH_FAILED",
            details: fetchError instanceof Error ? fetchError.message : 'Erreur de fetch'
          },
          { status: 500 }
        );
      }
    }

    // ✅ FALLBACK : Si pas d'URL Blob (anciens documents)
    console.error(`❌ URL Blob invalide pour le document ${documentId}: ${document.filePath}`);
    logApiAccess(request, session, false, "INVALID_BLOB_URL");
    
    return NextResponse.json(
      { 
        error: "Fichier non accessible", 
        code: "INVALID_BLOB_URL",
        details: "Le fichier n'est pas stocké sur Vercel Blob" 
      },
      { status: 404 }
    );
    
  } catch (error) {
    console.error("❌ Erreur lors du téléchargement:", error);
    logApiAccess(request, session, false, "DOWNLOAD_FAILED");
    
    return NextResponse.json(
      { 
        error: "Erreur serveur lors du téléchargement", 
        code: "DOWNLOAD_FAILED",
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

