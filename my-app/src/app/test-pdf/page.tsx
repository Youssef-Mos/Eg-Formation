// app/test-pdf-simple/page.tsx
"use client";

import { useState } from 'react';

export default function SimpleTestPDFPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const generateAndDownloadPDF = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      console.log('🧪 Génération PDF en cours...');
      
      // Import du générateur client-only
      const { generateTestPDF, getTestData } = await import('../utils/pdfGeneratorClientOnly');
      
      // Récupérer les données de test
      const { testStage, testUser, testOptions } = getTestData();
      
      console.log('📄 Données de test:', { 
        stage: testStage.Titre, 
        user: `${testUser.firstName} ${testUser.lastName}` 
      });
      
      // Générer le PDF
      const startTime = Date.now();
      const pdfBytes = await generateTestPDF(testStage, testUser, testOptions);
      const endTime = Date.now();
      
      // Créer le blob et déclencher le téléchargement
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Créer un lien de téléchargement temporaire
      const link = document.createElement('a');
      link.href = url;
      link.download = `test-convocation-${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setResult(`✅ PDF généré et téléchargé ! 
      Taille: ${(pdfBytes.length / 1024).toFixed(2)} KB
      Durée: ${endTime - startTime}ms`);
      
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      setResult(`❌ Erreur: ${error.message}`);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          🧪 Test PDF avec Logo
        </h1>
        
        <div className="space-y-4">
          {/* Aperçu du logo */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Aperçu du logo :</p>
            <img 
              src="/image/logo/Logo%20EG.jpg" 
              alt="Logo EG Formation" 
              className="max-h-16 mx-auto border rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              Si vous voyez le logo, c'est bon ! 👆
            </p>
          </div>

          {/* Bouton principal */}
          <button 
            onClick={generateAndDownloadPDF}
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Génération...
              </div>
            ) : (
              '📄 Générer et télécharger PDF'
            )}
          </button>

          {/* Résultat */}
          {result && (
            <div className={`p-4 rounded-lg text-sm ${
              result.startsWith('✅') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <pre className="whitespace-pre-wrap">{result}</pre>
            </div>
          )}

          {/* Infos sur le test */}
          <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-600">
            <h3 className="font-medium mb-2">Ce test va générer :</h3>
            <ul className="space-y-1 text-xs">
              <li>• PDF avec votre logo en haut</li>
              <li>• Données fictives (Jean EXEMPLE)</li>
              <li>• Stage de test à Paris</li>
              <li>• Type: Stage volontaire (cas 1)</li>
              <li>• Téléchargement automatique</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}