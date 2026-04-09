import { jsPDF } from "jspdf";
import { ComparisonMetrics, HouseData, AddressData } from "../types";

export const generatePDFReport = (
  metrics: ComparisonMetrics,
  houseData: HouseData,
  addressData: AddressData | undefined
) => {
  const doc = new jsPDF();
  
  // Constants
  const MARGIN_LEFT = 20;
  
  // Helper for colors - Updated to #132F8D (19, 47, 141)
  const setBlue = () => doc.setTextColor(19, 47, 141); 
  const setBlack = () => doc.setTextColor(0, 0, 0);
  const setGrey = () => doc.setTextColor(100, 100, 100);

  // HEADER
  setBlue();
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Watt About You", MARGIN_LEFT, 20);
  
  setGrey();
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Observatoire de la transition énergétique", MARGIN_LEFT, 26);
  
  doc.text(`Édité le ${new Date().toLocaleDateString()}`, 150, 20);
  
  // SEPARATOR
  doc.setDrawColor(200, 200, 200);
  doc.line(MARGIN_LEFT, 35, 190, 35);
  
  // ADDRESS INFO
  if (addressData) {
    setBlack();
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Logement analysé :", MARGIN_LEFT, 50);
    
    doc.setFont("helvetica", "normal");
    doc.text(`${addressData.street}`, MARGIN_LEFT, 56);
    doc.text(`${addressData.zipCode} ${addressData.city} (${addressData.department})`, MARGIN_LEFT, 62);
  }

  // HOUSE DATA
  doc.setFont("helvetica", "bold");
  doc.text("Caractéristiques :", 110, 50);
  doc.setFont("helvetica", "normal");
  doc.text(`• DPE : ${houseData.dpe}`, 110, 56);
  doc.text(`• GES : ${houseData.ges || 'N/A'}`, 110, 62);
  doc.text(`• Surface : ${houseData.surface} m²`, 110, 68);
  doc.text(`• Année : ${houseData.year}`, 110, 74);
  if (houseData.numeroDpe && houseData.numeroDpe !== 'N/A') {
    doc.text(`• N° DPE : ${houseData.numeroDpe}`, 110, 80);
  }
  
  // KEY METRIC BOX
  doc.setFillColor(243, 244, 246); // bg-gray-100
  doc.rect(MARGIN_LEFT, 85, 170, 40, "F");
  
  doc.setFontSize(14);
  setBlue();
  doc.text("Positionnement Énergétique", 30, 98);
  
  const isGood = metrics.differencePercentage <= 0;
  const diffSign = metrics.differencePercentage > 0 ? '+' : '';
  const diffText = `${diffSign}${Math.round(metrics.differencePercentage)}%`;
  
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  if (isGood) {
      doc.setTextColor(34, 197, 94); // Green
  } else {
      doc.setTextColor(239, 68, 68); // Red
  }
  doc.text(diffText, 30, 115);
  
  setGrey();
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("de consommation électrique", 80, 110);
  doc.text("par rapport aux foyers similaires", 80, 115);

  // DETAILS TABLE
  let y = 150;
  doc.setFontSize(14);
  setBlack();
  doc.setFont("helvetica", "bold");
  doc.text("Détails de la consommation annuelle", MARGIN_LEFT, y);
  
  y += 15;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  
  const addRow = (label: string, value: string, boldValue = false) => {
    doc.text(label, MARGIN_LEFT, y);
    if (boldValue) doc.setFont("helvetica", "bold");
    doc.text(value, 150, y);
    if (boldValue) doc.setFont("helvetica", "normal");
    doc.setDrawColor(240, 240, 240);
    doc.line(MARGIN_LEFT, y + 3, 190, y + 3);
    y += 12;
  };
  
  addRow("Votre consommation", `${metrics.userConsumption} kWh`, true);
  addRow("Moyenne du groupe DPE similaire", `${metrics.groupMean} kWh`);
  addRow("Médiane du groupe DPE similaire", `${metrics.groupMedian} kWh`);
  addRow("Votre percentile (Classement)", `${Math.round(metrics.percentile)}ème / 100`);

  // ADVICE
  y += 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  setBlue();
  doc.text("L'avis de l'expert", MARGIN_LEFT, y);
  
  y += 10;
  doc.setFontSize(11);
  setBlack();
  doc.setFont("helvetica", "normal");
  const advice = isGood 
    ? "Votre logement performe mieux que la moyenne des logements similaires. Continuez vos efforts de sobriété et assurez-vous de l'entretien régulier de vos équipements."
    : "Votre consommation est supérieure à la moyenne observée. Il existe probablement des gisements d'économies via l'isolation ou le remplacement d'équipements énergivores.";
    
  const splitAdvice = doc.splitTextToSize(advice, 170);
  doc.text(splitAdvice, MARGIN_LEFT, y);

  // FOOTER
  doc.setFontSize(9);
  setGrey();
  doc.text("Document généré via Watt About You - Données estimatives non contractuelles.", MARGIN_LEFT, 280);

  doc.save(`Bilan_WattAboutYou_${addressData?.city || "Logement"}.pdf`);
};