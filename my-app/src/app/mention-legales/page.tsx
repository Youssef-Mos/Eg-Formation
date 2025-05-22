"use client";

import Footer from "@/components/footer";
import Nav from "@/components/nav";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  FileText, 
  Info, 
  BookOpen, 
  Cookie, 
  Building,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function MentionsLegales() {
  const [activeTab, setActiveTab] = useState("cgv");
  const router = useRouter();
  
  return (
    <>
      <div className="min-h-screen flex max-sm:items-center justify-center gap-10 flex-col">
                          <Nav />
        
        <div className="flex-grow container max-w-6xl mx-auto pt-8 px-4 pb-16">
          <h1 className="text-3xl font-bold text-center mb-6">Mentions Légales et Conditions d'Utilisation</h1>
          
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <p className="text-center text-gray-700">
              Cette page contient l'ensemble des informations légales relatives à EG-FORMATIONS et aux conditions d'utilisation de notre service.
              Pour toute question, n'hésitez pas à nous contacter à <a href="mailto:contact@eg-formations.com" className="text-blue-600 hover:underline">contact@eg-formations.com</a>.
            </p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full items-center">
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="cgv" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline ">Conditions Générales</span>
                <span className="sm:hidden">CGV</span>
              </TabsTrigger>
              <TabsTrigger value="reglement" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Règlement Intérieur</span>
                <span className="sm:hidden">Règlement</span>
              </TabsTrigger>
              <TabsTrigger value="cookies" className="flex items-center gap-2">
                <Cookie className="w-4 h-4" />
                <span className="hidden sm:inline">Politique de Cookies</span>
                <span className="sm:hidden">Cookies</span>
              </TabsTrigger>
              <TabsTrigger value="legal" className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                <span className="hidden sm:inline">Informations Légales</span>
                <span className="sm:hidden">Infos</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Contenu des onglets */}
            <TabsContent value="cgv">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Conditions Générales d'Inscription
                  </CardTitle>
                  <CardDescription>
                    Applicables à compter du 27 février 2025
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[70vh] overflow-y-auto prose prose-sm">
                  <p>L'entreprise EG-FORMATIONS est éditeur du site ADRESSE DU SITE A DEFINIR (<a href="http://www.egformations.com" className="text-blue-600 hover:underline">www.egformations.com</a>) sur lequel elle propose au Conducteur l'inscription à un stage de sensibilisation à la Sécurité Routière objet des présentes conditions générales.</p>
                  
                  <h3 className="text-lg font-bold mt-4">Article 1 : Connaître son capital points pour un Conducteur</h3>
                  <p>Les informations relatives au capital de points d'un Conducteur sont déclaratives. Afin d'effectuer un stage volontaire de sensibilisation à la Sécurité Routière cas n°1 (récupération de 4 points), le Conducteur doit être muni d'un permis de conduire délivré obligatoirement en France, la reconstitution partielle de son capital de points à l'issue de la participation au stage n'étant pas possible si le titre n'a pas été délivré en France et le capital points du permis de conduire d'un Conducteur doit être compris entre 1 et 8 points sur le Fichier National du Permis de Conduire.</p>
                  <p>Si le Conducteur n'a jamais reçu d'information administrative (lettre 48, 48M, 48N, consultation du solde de points sur le site officiel du Ministère de l'Intérieur), l'informant de son solde de points, il doit demander un relevé intégral d'information (RII) auprès du Ministère de l'Intérieur. La consultation du solde de points à la Préfecture est sans conséquence sur le dossier. Dans le cas où le solde de points est nul mais que le Conducteur n'a pas encore réceptionné de lettre recommandée d'invalidation réf 48Si, il est peut-être encore possible de participer à un stage. A la demande du Conducteur, le service clients d'EG-FORMATIONS peut l'aider à mieux comprendre son relevé intégral d'information. En cas de fausse déclaration du Conducteur, la responsabilité d'EG-FORMATIONS ne pourra, en aucun cas, être engagée, et aucun remboursement, ni transfert de stage ne seront acceptés.</p>
                  
                  <h3 className="text-lg font-bold mt-4">Article 2 : Délai entre deux stages de récupération de points</h3>
                  <p>Selon la loi, un Conducteur ne peut récupérer ses points en participant à un stage de sensibilisation au risque routier, que dans la limite d'une fois par an (un an + un jour article L223-6 du code de la route).</p>
                  
                  <h3 className="text-lg font-bold mt-4">Article 3 : Les présentes conditions générales sont soumises au droit français.</h3>
                  
                  <h3 className="text-lg font-bold mt-4">Article 4 : Prix de vente des stages de sensibilisation à la Sécurité Routière</h3>
                  <p>Les tarifs d'inscription à un stage sont indiqués en €uro, toutes taxes comprises (TTC). Seuls les règlements en €uro sont acceptés. Les stages seront facturés sur la base des tarifs en vigueur au moment de l'enregistrement de la commande d'un Conducteur. L'inscription à un stage est effective à la date de validation du paiement.</p>
                  
                  <h3 className="text-lg font-bold mt-4">Article 5 : Modalités de commande</h3>
                  <p>L'inscription par les Conducteurs aux stages de sensibilisation à la Sécurité Routière se fait directement sur le site ADRESSE DU SITE A DEFINIR (<a href="http://www.egformations.com" className="text-blue-600 hover:underline">www.egformations.com</a>).</p>
                  
                  <h3 className="text-lg font-bold mt-4">Article 6 : Disponibilité des stages</h3>
                  <p>Tous les stages en ligne proposent des places disponibles aux dates indiquées sauf lorsque l'effectif maximum est atteint. La réglementation relative au permis à points prévoit l'annulation du stage par son organisateur entre autres, lorsque l'effectif n'atteint pas 6 participants. EG-FORMATIONS ne pourra en aucun cas être tenu responsable de ces annulations réglementaires, mais s'engage sur la demande du stagiaire à proposer une solution de transfert parmi tous les autres stages disponibles sur son site ou si elle n'est pas acceptée par le Conducteur le remboursement du stage.</p>
                  
                  <h3 className="text-lg font-bold mt-4">Article 7 : Modalités de paiement</h3>
                  <p>Deux modes de paiement sont possibles :</p>
                  <p><strong>1. Carte bancaire</strong> : CB, Visa et Mastercard sur l'interface de paiement du site. Il est précisé que la date d'achat prise en considération pour le débit de la carte sera celle de la commande du stage et non celle du début du stage.</p>
                  <p><strong>2. Chèque bancaire</strong> à l'ordre de EG-FORMATIONS.</p>
                  <p>Toute commande effectuée sur le site d'EG-FORMATIONS sera confirmée par un récapitulatif de commande sur le site Internet par un courriel automatique, si le Conducteur dispose d'une adresse email valide. Après vérification du service inscription la convocation au stage et la facture seront envoyées dans un 2ème courriel. Si l'adresse email fournie par le Conducteur est erronée, EG-FORMATIONS ne pourra être tenue responsable de la non-réception de l'email de confirmation.</p>
                  <p>L'inscription par CB est instantanée et confirmée immédiatement sous réserves de bogues informatiques.</p>
                  <p>L'inscription par chèque bancaire n'est ferme et définitive qu'à réception du paiement. L'inscription ne pourra avoir lieu s'il n'existe plus de places vacantes sur la session de stage à la réception du paiement par chèque, dans ce cas le Conducteur se verra proposer une autre session. La responsabilité d'EG-FORMATIONS ne pourra être engagée.</p>
                  
                  <h3 className="text-lg font-bold mt-4">Article 9 : Sécurisation des paiements en ligne</h3>
                  <p>Le site d'EG-FORMATIONS est équipés d'un système de paiement immédiat par carte bancaire sécurisé SSL via le serveur STRIPE. Le paiement est effectué directement sur l'espace sécurisé de STRIPE.</p>
                  
                  <h3 className="text-lg font-bold mt-4">Article 10 : Annulation d'une inscription - Conditions de remboursement</h3>
                  <p>L'annulation, le transfert ou le remboursement peuvent être effectués à la demande du Conducteur jusqu'à 7 jours avant le premier jour du stage. En cas de remboursement, il sera déduit des frais de gestion du dossier de 9,50€.</p>
                  <p>En cas de mise en attente du dossier d'inscription en salle d'attente, le Conducteur a deux ans, à partir de la date de la 1ère mise en attente, pour choisir une nouvelle date de stage ou pour être remboursé.</p>
                  <p>Toute demande d'annulation du fait du Conducteur devra être faite par courriel : <a href="mailto:contact@eg-formations.com" className="text-blue-600 hover:underline">contact@eg-formations.com</a> assortie d'une validation par téléphone auprès du service Clients d'EG-FORMATIONS : 07 83 37 25 65.</p>
                  <p>Le remboursement se fait par défaut à l'ordre de l'utilisateur du service. Dans le cas de l'utilisation du moyen de paiement d'un tiers, l'utilisateur devra préciser par courrier le nom du bénéficiaire. Toute fausse déclaration sur l'identité du bénéficiaire est passible de poursuites. Pour les paiements par CB, le remboursement intervient dans les 7 jours à partir de la date de la demande sur la CB ayant servie au paiement initial. Pour les paiements par chèque, EG-FORMATIONS attend le délai de retour des chèques impayés (un mois) pour procéder au remboursement. Le remboursement se fait par virement à l'ordre de l'émetteur du chèque initial.</p>
                  
                  <h4 className="font-semibold mt-3">Dispositions relatives à la vente à distance :</h4>
                  <p>Le Conducteur dispose d'un délai légal de rétractation de 14 jours (Loi Hamon) qui commence dès l'inscription définitive (date du paiement ou date du transfert) et se termine dans tous les cas la veille du stage avant 18h. Le Conducteur n'a pas à motiver sa décision. La demande de rétractation doit être faite par courriel : <a href="mailto:contact@eg-formations.com" className="text-blue-600 hover:underline">contact@eg-formations.com</a> assortie d'une validation par téléphone auprès du service Clients d'EG-FORMATIONS : 07 83 37 25 65 au plus tard la veille avant 18h00.</p>
                  
                  <h4 className="font-semibold mt-3">Annulation de la session de stage par le centre agréé :</h4>
                  <p>Le Conducteur se voit proposer par EG-FORMATIONS le transfert de son Stage sans surcoût. A défaut de transfert, ou sur simple demande, le Conducteur peut également être remboursé sans frais.</p>
                  
                  <h4 className="font-semibold mt-3">Annulation de la participation à l'initiative du Conducteur :</h4>
                  <p>Dans le cas d'épuisement du délai de rétractation relatif à la loi sur la vente à distance :</p>
                  <p>Sauf conditions particulières plus restrictives, en cas d'annulation ou de transfert à l'initiative du conducteur entre 7 jours et 2 jours ouvrés avant la date du stage, des frais d'annulation d'un montant de 50 € seront décomptés. Si l'annulation ou le transfert se fait à moins de 2 jours ouvrés avant le stage, le prix du stage est dû entièrement. L'absence, même partielle, au stage, ou le non-respect des horaires par le Conducteur, ne donne droit ni à la récupération de points, ni au remboursement, ni au transfert sur un autre stage. Si l'absence est justifiée par un certificat médical ou d'hospitalisation en bonne et due forme et transmis par courriel dans les 48 heures maximum à partir du dernier jour de stage à l'adresse suivante <a href="mailto:contact@eg-formations.com" className="text-blue-600 hover:underline">contact@eg-formations.com</a>, un transfert sera possible sur une autre session.</p>

                  <h3 className="text-lg font-bold mt-4">Article 11 : Obligations des Conducteurs lors d'un stage</h3>
                  <p>Pendant le déroulement du stage, le Conducteur s'engage à respecter avec exactitude les horaires qui seront communiqués par EG-FORMATIONS dès l'inscription. L'organisateur du stage se réserve le droit d'exclure à tout moment tout Conducteur dont le comportement gênerait le bon déroulement du stage, comme la réglementation l'y autorise. En cas de non-respect des consignes la responsabilité d'EG-FORMATIONS ne pourra en aucun cas être engagée. La délivrance des attestations de stage reste la prérogative légale du Directeur du centre agrée et des animateurs, tout comme la télétransmission de la participation au Stage à l'Administration française (ANTS) pour l'enregistrement des points récupérés. L'instruction par l'administration du dossier de demande de reconstitution partielle du capital de points est conditionnée à la transmission d'un justificatif d'identité (CNI, passeport, titre de séjour) ainsi que de la copie du permis de conduire (à défaut un avis de rétention ou suspension du permis de conduire). <strong>Il incombe donc au Conducteur de fournir ces pièces par voie dématérialisée dans les meilleurs délais à EG-FORMATIONS, au plus tard le premier jour du stage.</strong></p>
                  
                  <h3 className="text-lg font-bold mt-4">Article 12 : Litiges</h3>
                  <p>En cas de litige, les systèmes informatiques d'EG-FORMATIONS sont considérés comme valant preuve de la nature de la convention et de sa date. Le site administré par EG-FORMATIONS étant édité en France, le présent contrat n'est soumis qu'à la loi française. À défaut d'accord amiable, le consommateur pourra, conformément aux articles L 612-1 et suivant du Code de la consommation, recourir, s'il le souhaite, à la Médiation de la consommation en saisissant le médiateur par voie électronique (ou postale) : <strong>Nord Médiation</strong> 8, rue d'Angleterre 59000 LILLE, courriel : <a href="mailto:asso.nord.mediation@nordnet.fr" className="text-blue-600 hover:underline">asso.nord.mediation@nordnet.fr</a>.</p>
                  
                  <h3 className="text-lg font-bold mt-4">Article 13 : Informations nominatives protection de la vie privée</h3>
                  <p>Conformément à la loi informatique et libertés du 6 janvier 1978, vous disposez d'un droit d'accès, de rectification, et d'opposition aux données personnelles vous concernant. Pour cela, il suffit de faire la demande par courrier en indiquant votre nom, prénom et adresse à l'adresse suivante : EG-FORMATIONS. Service Client -- 61, rue de Lyon 75012 Paris ou par courriel : <a href="mailto:contact@eg-formations.com" className="text-blue-600 hover:underline">contact@eg-formations.com</a>. EG-FORMATIONS s'engage à ne pas divulguer et à ne pas vendre à des tiers les informations qui lui seront transmises.</p>
                  
                  <h3 className="text-lg font-bold mt-4">Article 14 : Validation des Conditions Générales d'Inscription</h3>
                  <p>Avant de valider son inscription, y compris par téléphone, le Conducteur déclare avoir pris connaissance et accepté les présentes Conditions Générales d'Inscription à sa disposition sur le Site, sinon il ne peut bénéficier des prestations proposées par EG-FORMATIONS. En tout état de cause, en cas de non-validation des Conditions Générales d'Inscription par le Conducteur, celui-ci peut choisir de ne pas souscrire au service offert par EG-FORMATIONS, voire de résilier ledit service dans les conditions des présentes.</p>
                  
                  <h3 className="text-lg font-bold mt-4">Article 15 : Force majeure</h3>
                  <p>Les obligations des parties seront suspendues de plein droit et sans formalité et leur responsabilité dégagée en cas de survenance d'un cas de force majeure entendu comme tout évènement échappant au contrôle d'une partie et qui ne pouvait être raisonnablement prévu lors de l'inscription d'un Conducteur sur l'un des Sites, et dont les effets ne peuvent être évités par des mesures appropriées et ce, conformément aux dispositions de l'article 1218 du Code civil et de la jurisprudence française.</p>
                  
                  <h3 className="text-lg font-bold mt-4">Article 16 : Services Relations Clients</h3>
                  <p>Pour toute information ou question, EG-FORMATIONS dispose d'un Service, à votre disposition : par téléphone, au numéro 07 83 37 25 65, du lundi au samedi, de 9 heures à 18 heures ou, par courriel : <a href="mailto:contact@eg-formations.com" className="text-blue-600 hover:underline">contact@eg-formations.com</a>.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reglement">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Règlement Intérieur
                  </CardTitle>
                  <CardDescription>
                    Applicable à tous les stagiaires durant la formation
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[70vh] overflow-y-auto prose prose-sm">
                  <h3 className="text-lg font-bold mt-2">ARTICLE 1 : APPLICATION</h3>
                  <p>Le présent règlement s'applique à tous les stagiaires, et ce pour toute la durée de la formation suivie. Il devra obligatoirement être émargé par le stagiaire avant le début de la formation. Le refus d'émarger le règlement intérieur entraîne l'exclusion immédiate.</p>
                  
                  <h3 className="text-lg font-bold mt-4">ARTICLE 2 : DISCIPLINE</h3>
                  <p>Il est formellement interdit aux stagiaires :</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>D'introduire des boissons alcoolisées ou des produits psychoactifs dans les locaux de l'organisme ;</li>
                    <li>De se présenter en formation en état d'ébriété ; en cas de doute un contrôle d'alcoolémie pourra être effectué en cas de refus ou contrôle positif cela entrainera l'exclusion sans délai du stagiaire ;</li>
                    <li>D'utiliser leur téléphone portable ou tout autre moyen de communication ; ils devront être éteints durant la formation ;</li>
                    <li>D'enregistrer par quelque nature que ce soit, de prendre des photos ;</li>
                    <li>De faire usage d'un moyen informatique (pc, tablette...) ;</li>
                    <li>De lire des revues.</li>
                  </ul>
                  
                  <h3 className="text-lg font-bold mt-4">ARTICLE 3 : CAS D'EXCLUSION</h3>
                  <p>Tout agissement considéré comme fautif par la direction et/ou par le personnel de l'organisme de formation pourra, en fonction de sa nature et sa gravité, faire l'objet d'un rappel à l'ordre ou d'une exclusion définitive.</p>
                  <p>Les cas d'exclusions définitives de la formation sans que cette liste soit exhaustive :</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Désintérêt manifeste pour la formation dispensée et absence de participation ;</li>
                    <li>Comportement faisant manifestement apparaître la consommation de produits psychoactifs ;</li>
                    <li>Non-respect des horaires ;</li>
                    <li>Non-acquittement du règlement le premier jour du stage ;</li>
                    <li>Non-respect de l'établissement et de son personnel.</li>
                  </ul>
                  
                  <h3 className="text-lg font-bold mt-4">ARTICLE 4 : ENTRETIEN PREALABLE A L'EXCLUSION ET PROCEDURE</h3>
                  <p>Aucune exclusion ne peut être infligée au stagiaire sans que celui-ci n'en soit informé verbalement et confirmé par courriel à l'issue du stage.</p>
                  <p>Lorsque l'organisme de formation envisage une prise de sanction, le personnel de l'établissement informe le stagiaire ou les stagiaires de leur comportement fautif et pourra procéder à tout moment à l'exclusion du stagiaire. A l'issue du stage l'organisme de formation notifiera par courriel les motifs de leur décision et en informera Monsieur le Préfet du département.</p>
                  
                  <h3 className="text-lg font-bold mt-4">ARTICLE 5 : HORAIRES DE FORMATION</h3>
                  <p>Les horaires de formation sont définis exclusivement par l'organisme EG-FORMATIONS.</p>
                  <p>Les horaires de stage sont propres à chaque lieu et peuvent être consultés sur la convocation au stage adressée au stagiaire. Les moments de pauses sont définis à l'avance par les animateurs et doivent être respectés. Le stagiaire s'engage à les respecter scrupuleusement.</p>
                  
                  <h3 className="text-lg font-bold mt-4">ARTICLE 6 : CONDITIONS GENERALES DE VENTE</h3>
                  <p>Tout désistement ou report de stage doit nous être communiqué impérativement au minimum 5 jours avant la date du stage initial. Faute de respecter ce délai, une somme de 50,00 €uro sera conservée pour les frais administratifs (ou réclamée si le stage n'a pas été réglé). Attention pour une annulation, un abandon, une exclusion ou un report moins de 48 heures avant le premier de jour stage ; la somme complète du stage sera conservée ou réclamé si le stage n'a pas été réglé (sauf cas de force majeure maladie par exemple).</p>
                  <p>Tout désistement ou abandon ne fera l'objet d'aucun remboursement. En cas d'absence non signalé le jour du stage ou abandon par le stagiaire en cours de formation, le montant total du règlement est conservé par l'organisme de formation.</p>
                  <p>En cas d'absence pour cas de force majeure et pour procéder au report du stage, le stagiaire devra produire impérativement un justificatif dans les 48 heures suivant la fin du stage.</p>
                  
                  <h3 className="text-lg font-bold mt-4">ARTICLE 7 : OBLIGATIONS DU STAGIAIRE</h3>
                  <p>Dans le cadre d'un suivi de stage pour une récupération de points, le stagiaire doit prendre connaissance de son solde de point et de la validité de son permis de conduire auprès d'une préfecture et ceci avant le stage. Pour chaque demi-journée de formation, le stagiaire s'engage à signer la fiche de présence. Pour information un délai d'un an et un jour doit être respecté entre deux dates de stage pour une récupération de points. Toutes les informations relatives aux stages de sensibilisation peuvent être consultées sur les sites <a href="http://www.securiteroutiere.gouv.fr" className="text-blue-600 hover:underline">www.securiteroutiere.gouv.fr</a>, <a href="http://www.service-public.fr" className="text-blue-600 hover:underline">www.service-public.fr</a> et sur le site de la préfecture de votre lieu de résidence.</p>
                  <p>En application des dispositions de l'article 15 de l'arrêté du 26 juin 2012 ; le stagiaire s'engage à transmettre à l'administration copie de sa pièce d'identité, copie de son permis de conduire et tout document nécessaire à l'instruction du dossier au plus tard dans le premier jour du stage.</p>
                  
                  <h3 className="text-lg font-bold mt-4">ARTICLE 8</h3>
                  <p>Le stagiaire reconnait avoir compris tous les termes du présent règlement sans aucune réserve. Une copie du présent règlement pourra être remis au stagiaire sur simple demande.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="cookies">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Cookie className="w-5 h-5 mr-2" />
                    Politique de Cookies
                  </CardTitle>
                  <CardDescription>
                    Comment nous utilisons les cookies sur notre site
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[70vh] overflow-y-auto prose prose-sm">
                  <h3 className="text-lg font-bold mt-2">Qu'est-ce qu'un cookie ?</h3>
                  <p>Un cookie est un petit fichier texte qui peut être placé sur votre appareil lorsque vous visitez un site web. Les cookies sont largement utilisés pour faire fonctionner les sites web ou les faire fonctionner plus efficacement, ainsi que pour fournir des informations aux propriétaires du site.</p>
                  
                  <h3 className="text-lg font-bold mt-4">Comment utilisons-nous les cookies ?</h3>
                  <p>EG-FORMATIONS utilise différents types de cookies sur son site pour améliorer votre expérience et vous offrir certaines fonctionnalités :</p>
                  
                  <h4 className="font-semibold mt-3">Cookies strictement nécessaires</h4>
                  <p>Ces cookies sont essentiels pour vous permettre de naviguer sur notre site et d'utiliser ses fonctionnalités, telles que l'accès aux zones sécurisées du site. Sans ces cookies, les services que vous avez demandés, comme les paniers d'achat ou les réservations de stage, ne peuvent pas être fournis. Ces cookies ne recueillent pas d'informations sur vous qui pourraient être utilisées à des fins de marketing ou pour se souvenir des sites web que vous avez visités sur Internet.</p>
                  
                  <h4 className="font-semibold mt-3">Cookies de fonctionnalité</h4>
                  <p>Ces cookies permettent à notre site web de se souvenir des choix que vous faites (comme votre nom d'utilisateur, votre langue ou la région dans laquelle vous vous trouvez) et de fournir des fonctionnalités améliorées et plus personnelles. Ces cookies peuvent également être utilisés pour mémoriser les changements que vous avez apportés à la taille du texte, aux polices et autres parties des pages web que vous pouvez personnaliser.</p>
                  
                  <h4 className="font-semibold mt-3">Cookies analytiques/de performance</h4>
                  <p>Ces cookies collectent des informations sur la façon dont les visiteurs utilisent notre site web, par exemple quelles pages ils visitent le plus souvent, et s'ils reçoivent des messages d'erreur de ces pages. Ces cookies ne collectent pas d'informations permettant d'identifier un visiteur. Toutes les informations collectées par ces cookies sont agrégées et donc anonymes. Elles ne sont utilisées que pour améliorer le fonctionnement de notre site web.</p>
                  
                  <h3 className="text-lg font-bold mt-4">Comment gérer vos cookies</h3>
                  <p>Vous pouvez gérer vos préférences en matière de cookies en modifiant les paramètres de votre navigateur Internet pour qu'il refuse tout ou partie des cookies ou vous alerte lorsque des cookies sont envoyés. Si vous désactivez ou refusez les cookies, veuillez noter que certaines parties de ce site peuvent devenir inaccessibles ou ne pas fonctionner correctement.</p>
                  <p>Pour plus d'informations sur la façon de gérer les cookies dans votre navigateur web, consultez les pages suivantes :</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Google Chrome : <a href="https://support.google.com/chrome/answer/95647" className="text-blue-600 hover:underline">https://support.google.com/chrome/answer/95647</a></li>
                    <li>Mozilla Firefox : <a href="https://support.mozilla.org/kb/enable-and-disable-cookies-website-preferences" className="text-blue-600 hover:underline">https://support.mozilla.org/kb/enable-and-disable-cookies-website-preferences</a></li>
                    <li>Safari : <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" className="text-blue-600 hover:underline">https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac</a></li>
                    <li>Internet Explorer : <a href="https://support.microsoft.com/help/17442/windows-internet-explorer-delete-manage-cookies" className="text-blue-600 hover:underline">https://support.microsoft.com/help/17442/windows-internet-explorer-delete-manage-cookies</a></li>
                  </ul>
                  
                  <h3 className="text-lg font-bold mt-4">Durée de conservation des cookies</h3>
                  <p>Nos cookies ont différentes durées de validité :</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Cookies de session : ces cookies temporaires expirent et sont automatiquement supprimés lorsque vous fermez votre navigateur.</li>
                    <li>Cookies persistants : ces cookies restent sur votre appareil jusqu'à ce qu'ils expirent ou jusqu'à ce que vous les supprimiez manuellement.</li>
                  </ul>
                  
                  <h3 className="text-lg font-bold mt-4">Cookies tiers</h3>
                  <p>Nous utilisons également des services tiers qui peuvent placer des cookies sur votre appareil lorsque vous visitez notre site. Ces services incluent :</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Google Analytics : pour l'analyse du trafic sur notre site</li>
                    <li>STRIPE : pour le traitement des paiements sécurisés</li>
                  </ul>
                  
                  <h3 className="text-lg font-bold mt-4">Modifications de notre politique de cookies</h3>
                  <p>Nous nous réservons le droit de modifier cette politique de cookies à tout moment. Tout changement sera publié sur cette page avec une date de révision mise à jour.</p>
                  
                  <h3 className="text-lg font-bold mt-4">Contact</h3>
                  <p>Si vous avez des questions concernant notre utilisation des cookies, vous pouvez nous contacter à <a href="mailto:contact@eg-formations.com" className="text-blue-600 hover:underline">contact@eg-formations.com</a>.</p>
                  
                  <div className="text-sm text-gray-500 mt-8">
                    <p>Dernière mise à jour : 22 mai 2025</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="legal">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="w-5 h-5 mr-2" />
                    Informations Légales
                  </CardTitle>
                  <CardDescription>
                    Informations légales concernant EG-FORMATIONS
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[70vh] overflow-y-auto prose prose-sm">
                  <h3 className="text-lg font-bold mt-2">Éditeur du site</h3>
                  <p>Le site www.egformations.com est édité par :</p>
                  <div className="pl-4 my-3">
                    <p><strong>EG-FORMATIONS</strong></p>
                    <p>Société à responsabilité limitée (SARL)</p>
                    <p>Capital social : 10 000 €</p>
                    <p>Numéro SIRET : 123 456 789 00012</p>
                    <p>Code APE : 8559A - Formation continue d'adultes</p>
                    <p>Numéro de TVA intracommunautaire : FR12 123456789</p>
                    <p>Siège social : 61, rue de Lyon 75012 Paris</p>
                    <p>Téléphone : 07 83 37 25 65</p>
                    <p>Email : <a href="mailto:contact@eg-formations.com" className="text-blue-600 hover:underline">contact@eg-formations.com</a></p>
                  </div>
                  
                  <h3 className="text-lg font-bold mt-4">Représentant légal</h3>
                  <p>Le site www.egformations.com est représenté par :</p>
                  <div className="pl-4 my-3">
                    <p>Monsieur/Madame [Nom du gérant]</p>
                    <p>Agissant en qualité de Gérant</p>
                  </div>
                  
                  <h3 className="text-lg font-bold mt-4">Hébergement du site</h3>
                  <p>Le site www.egformations.com est hébergé par :</p>
                  <div className="pl-4 my-3">
                    <p>[Nom de l'hébergeur]</p>
                    <p>Adresse : [Adresse de l'hébergeur]</p>
                    <p>Téléphone : [Téléphone de l'hébergeur]</p>
                  </div>
                  
                  <h3 className="text-lg font-bold mt-4">Déclarations officielles</h3>
                  <div className="pl-4 my-3">
                    <p><strong>Activité de formation professionnelle :</strong> EG-FORMATIONS est un organisme de formation enregistré sous le numéro [numéro de déclaration d'activité] auprès du préfet de région d'Île-de-France.</p>
                    <p><strong>Agrément préfectoral :</strong> EG-FORMATIONS est un centre de sensibilisation à la sécurité routière agréé par la préfecture de [département] sous le numéro [numéro d'agrément].</p>
                  </div>
                  
                  <h3 className="text-lg font-bold mt-4">Protection des données personnelles</h3>
                  <p>Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification, de limitation, de portabilité et de suppression de vos données personnelles.</p>
                  <p>Pour exercer ces droits ou pour toute question sur le traitement de vos données, vous pouvez contacter notre délégué à la protection des données (DPO) :</p>
                  <div className="pl-4 my-3">
                    <p>Par email : <a href="mailto:dpo@eg-formations.com" className="text-blue-600 hover:underline">dpo@eg-formations.com</a></p>
                    <p>Par courrier : EG-FORMATIONS, Service DPO, 61, rue de Lyon 75012 Paris</p>
                  </div>
                  <p>Pour plus d'informations sur la façon dont nous traitons vos données, consultez notre Politique de Confidentialité accessible depuis notre site web.</p>
                  
                  <h3 className="text-lg font-bold mt-4">Propriété intellectuelle</h3>
                  <p>L'ensemble du contenu du site www.egformations.com (images, textes, vidéos, logo, etc.) est la propriété exclusive d'EG-FORMATIONS ou de tiers ayant autorisé EG-FORMATIONS à les utiliser.</p>
                  <p>Toute reproduction, représentation, modification, publication, adaptation, totale ou partielle des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable d'EG-FORMATIONS.</p>
                  <p>Toute exploitation non autorisée du site ou de l'un quelconque des éléments qu'il contient sera considérée comme constitutive d'une contrefaçon et poursuivie conformément aux dispositions des articles L.335-2 et suivants du Code de Propriété Intellectuelle.</p>
                  
                  <h3 className="text-lg font-bold mt-4">Liens hypertextes et références</h3>
                  <p>La création de liens hypertextes vers le site www.egformations.com est soumise à l'accord préalable d'EG-FORMATIONS. Les liens hypertextes établis en direction d'autres sites à partir de www.egformations.com ne sauraient, en aucun cas, engager la responsabilité d'EG-FORMATIONS, notamment au regard de leur contenu.</p>
                  
                  <h3 className="text-lg font-bold mt-4">Droit applicable et juridiction compétente</h3>
                  <p>Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.</p>
                  
                  <div className="text-sm text-gray-500 mt-8">
                    <p>Dernière mise à jour : 22 mai 2025</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="mt-8 flex justify-center">
            <Button 
              variant="outline" 
              onClick={() => router.push("/")}
              className="px-6"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </div>
        </div>
        
        <div className="bottom-0 w-screen"><Footer /></div>
      </div>
    </>
  );
}