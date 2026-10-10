/**
 * Startwerte der globalen Lebensmittel-Datenbank (ReferenceLebensmittel),
 * Nährwerte je 100 g bzw. 100 ml. Gerundete Richtwerte aus gängigen
 * Nährwerttabellen (Bundeslebensmittelschlüssel-Größenordnung) — Sorten und
 * Zubereitungen schwanken real um ±10–20 %. Kohlenhydrate sind
 * "verwertbare" Kohlenhydrate (deutsche Kennzeichnung, ohne Ballaststoffe).
 *
 * Liegt unter src/ (nicht prisma/), damit lebensmittel-startwerte.test.ts
 * die Konsistenz kcal ≈ 4·P + 4·KH + 9·F automatisch prüfen kann.
 */
export interface LebensmittelStartwert {
  bezeichnung: string;
  kategorie: string;
  kcalPro100g: number;
  proteinPro100g: number;
  kohlenhydratePro100g: number;
  fettPro100g: number;
  standardPortionG: number;
  /** Alkohol liefert ~7 kcal/g, die in keinem Makro auftauchen — von der Konsistenzprüfung ausgenommen. */
  enthaeltAlkohol?: boolean;
}

export const LEBENSMITTEL_STARTWERTE: LebensmittelStartwert[] = [
  // Brot & Getreide
  { bezeichnung: "Vollkornbrot", kategorie: "Brot & Getreide", kcalPro100g: 210, proteinPro100g: 7, kohlenhydratePro100g: 39, fettPro100g: 1.5, standardPortionG: 50 },
  { bezeichnung: "Weizenbrötchen", kategorie: "Brot & Getreide", kcalPro100g: 265, proteinPro100g: 9, kohlenhydratePro100g: 52, fettPro100g: 1.5, standardPortionG: 55 },
  { bezeichnung: "Toastbrot", kategorie: "Brot & Getreide", kcalPro100g: 260, proteinPro100g: 8, kohlenhydratePro100g: 48, fettPro100g: 3.5, standardPortionG: 25 },
  { bezeichnung: "Haferflocken", kategorie: "Brot & Getreide", kcalPro100g: 370, proteinPro100g: 13.5, kohlenhydratePro100g: 58.7, fettPro100g: 7, standardPortionG: 50 },
  { bezeichnung: "Müsli, ungesüßt", kategorie: "Brot & Getreide", kcalPro100g: 360, proteinPro100g: 10, kohlenhydratePro100g: 60, fettPro100g: 7, standardPortionG: 60 },
  { bezeichnung: "Cornflakes", kategorie: "Brot & Getreide", kcalPro100g: 370, proteinPro100g: 7, kohlenhydratePro100g: 84, fettPro100g: 0.9, standardPortionG: 40 },
  { bezeichnung: "Nudeln, gekocht", kategorie: "Brot & Getreide", kcalPro100g: 150, proteinPro100g: 5.5, kohlenhydratePro100g: 30, fettPro100g: 0.9, standardPortionG: 200 },
  { bezeichnung: "Nudeln, roh", kategorie: "Brot & Getreide", kcalPro100g: 355, proteinPro100g: 12.5, kohlenhydratePro100g: 70, fettPro100g: 1.5, standardPortionG: 100 },
  { bezeichnung: "Reis, gekocht", kategorie: "Brot & Getreide", kcalPro100g: 130, proteinPro100g: 2.7, kohlenhydratePro100g: 28, fettPro100g: 0.3, standardPortionG: 180 },
  { bezeichnung: "Reis, roh", kategorie: "Brot & Getreide", kcalPro100g: 350, proteinPro100g: 7, kohlenhydratePro100g: 78, fettPro100g: 0.6, standardPortionG: 75 },
  { bezeichnung: "Quinoa, gekocht", kategorie: "Brot & Getreide", kcalPro100g: 120, proteinPro100g: 4.4, kohlenhydratePro100g: 21, fettPro100g: 1.9, standardPortionG: 150 },
  { bezeichnung: "Croissant", kategorie: "Brot & Getreide", kcalPro100g: 400, proteinPro100g: 8, kohlenhydratePro100g: 45, fettPro100g: 21, standardPortionG: 60 },

  // Kartoffeln
  { bezeichnung: "Kartoffeln, gekocht", kategorie: "Kartoffeln", kcalPro100g: 72, proteinPro100g: 2, kohlenhydratePro100g: 15, fettPro100g: 0.1, standardPortionG: 200 },
  { bezeichnung: "Pommes frites", kategorie: "Kartoffeln", kcalPro100g: 290, proteinPro100g: 3.5, kohlenhydratePro100g: 36, fettPro100g: 15, standardPortionG: 150 },
  { bezeichnung: "Bratkartoffeln", kategorie: "Kartoffeln", kcalPro100g: 140, proteinPro100g: 2.5, kohlenhydratePro100g: 18, fettPro100g: 6.5, standardPortionG: 200 },

  // Milchprodukte & Eier
  { bezeichnung: "Vollmilch 3,5 %", kategorie: "Milchprodukte & Eier", kcalPro100g: 64, proteinPro100g: 3.3, kohlenhydratePro100g: 4.8, fettPro100g: 3.5, standardPortionG: 250 },
  { bezeichnung: "Fettarme Milch 1,5 %", kategorie: "Milchprodukte & Eier", kcalPro100g: 47, proteinPro100g: 3.4, kohlenhydratePro100g: 4.9, fettPro100g: 1.5, standardPortionG: 250 },
  { bezeichnung: "Naturjoghurt 3,5 %", kategorie: "Milchprodukte & Eier", kcalPro100g: 61, proteinPro100g: 3.5, kohlenhydratePro100g: 4, fettPro100g: 3.5, standardPortionG: 150 },
  { bezeichnung: "Magerquark", kategorie: "Milchprodukte & Eier", kcalPro100g: 67, proteinPro100g: 12, kohlenhydratePro100g: 4, fettPro100g: 0.2, standardPortionG: 250 },
  { bezeichnung: "Skyr", kategorie: "Milchprodukte & Eier", kcalPro100g: 63, proteinPro100g: 11, kohlenhydratePro100g: 4, fettPro100g: 0.2, standardPortionG: 150 },
  { bezeichnung: "Gouda (45 % F. i. Tr.)", kategorie: "Milchprodukte & Eier", kcalPro100g: 360, proteinPro100g: 25, kohlenhydratePro100g: 0, fettPro100g: 28, standardPortionG: 30 },
  { bezeichnung: "Mozzarella", kategorie: "Milchprodukte & Eier", kcalPro100g: 250, proteinPro100g: 18, kohlenhydratePro100g: 1, fettPro100g: 19, standardPortionG: 125 },
  { bezeichnung: "Doppelrahmfrischkäse", kategorie: "Milchprodukte & Eier", kcalPro100g: 290, proteinPro100g: 5.5, kohlenhydratePro100g: 3, fettPro100g: 28, standardPortionG: 30 },
  { bezeichnung: "Butter", kategorie: "Milchprodukte & Eier", kcalPro100g: 740, proteinPro100g: 0.7, kohlenhydratePro100g: 0.6, fettPro100g: 83, standardPortionG: 10 },
  { bezeichnung: "Hühnerei", kategorie: "Milchprodukte & Eier", kcalPro100g: 145, proteinPro100g: 12.6, kohlenhydratePro100g: 0.7, fettPro100g: 10, standardPortionG: 60 },

  // Fleisch, Wurst & Fisch
  { bezeichnung: "Hähnchenbrust, roh", kategorie: "Fleisch & Fisch", kcalPro100g: 110, proteinPro100g: 23.5, kohlenhydratePro100g: 0, fettPro100g: 1.5, standardPortionG: 150 },
  { bezeichnung: "Rinderhackfleisch", kategorie: "Fleisch & Fisch", kcalPro100g: 215, proteinPro100g: 20, kohlenhydratePro100g: 0, fettPro100g: 15, standardPortionG: 125 },
  { bezeichnung: "Schweineschnitzel, roh", kategorie: "Fleisch & Fisch", kcalPro100g: 110, proteinPro100g: 22, kohlenhydratePro100g: 0, fettPro100g: 2, standardPortionG: 150 },
  { bezeichnung: "Bratwurst", kategorie: "Fleisch & Fisch", kcalPro100g: 300, proteinPro100g: 13, kohlenhydratePro100g: 0.5, fettPro100g: 27, standardPortionG: 100 },
  { bezeichnung: "Salami", kategorie: "Fleisch & Fisch", kcalPro100g: 380, proteinPro100g: 22, kohlenhydratePro100g: 0.5, fettPro100g: 32, standardPortionG: 30 },
  { bezeichnung: "Kochschinken", kategorie: "Fleisch & Fisch", kcalPro100g: 120, proteinPro100g: 20, kohlenhydratePro100g: 1, fettPro100g: 4, standardPortionG: 30 },
  { bezeichnung: "Lachs, roh", kategorie: "Fleisch & Fisch", kcalPro100g: 200, proteinPro100g: 20, kohlenhydratePro100g: 0, fettPro100g: 13.5, standardPortionG: 125 },
  { bezeichnung: "Thunfisch im eigenen Saft (abgetropft)", kategorie: "Fleisch & Fisch", kcalPro100g: 110, proteinPro100g: 25, kohlenhydratePro100g: 0, fettPro100g: 1, standardPortionG: 120 },

  // Hülsenfrüchte & Pflanzliches Eiweiß
  { bezeichnung: "Linsen, gekocht", kategorie: "Hülsenfrüchte & Tofu", kcalPro100g: 115, proteinPro100g: 9, kohlenhydratePro100g: 20, fettPro100g: 0.4, standardPortionG: 200 },
  { bezeichnung: "Kichererbsen (Dose, abgetropft)", kategorie: "Hülsenfrüchte & Tofu", kcalPro100g: 120, proteinPro100g: 7, kohlenhydratePro100g: 16, fettPro100g: 2.5, standardPortionG: 120 },
  { bezeichnung: "Tofu, natur", kategorie: "Hülsenfrüchte & Tofu", kcalPro100g: 125, proteinPro100g: 13, kohlenhydratePro100g: 1.5, fettPro100g: 7.5, standardPortionG: 100 },

  // Obst
  { bezeichnung: "Apfel", kategorie: "Obst", kcalPro100g: 54, proteinPro100g: 0.3, kohlenhydratePro100g: 12, fettPro100g: 0.2, standardPortionG: 150 },
  { bezeichnung: "Banane", kategorie: "Obst", kcalPro100g: 93, proteinPro100g: 1.1, kohlenhydratePro100g: 21, fettPro100g: 0.2, standardPortionG: 120 },
  { bezeichnung: "Orange", kategorie: "Obst", kcalPro100g: 47, proteinPro100g: 1, kohlenhydratePro100g: 9, fettPro100g: 0.2, standardPortionG: 150 },
  { bezeichnung: "Erdbeeren", kategorie: "Obst", kcalPro100g: 33, proteinPro100g: 0.8, kohlenhydratePro100g: 5.5, fettPro100g: 0.4, standardPortionG: 150 },
  { bezeichnung: "Weintrauben", kategorie: "Obst", kcalPro100g: 70, proteinPro100g: 0.7, kohlenhydratePro100g: 16, fettPro100g: 0.3, standardPortionG: 125 },
  { bezeichnung: "Heidelbeeren", kategorie: "Obst", kcalPro100g: 45, proteinPro100g: 0.7, kohlenhydratePro100g: 8.5, fettPro100g: 0.6, standardPortionG: 125 },
  { bezeichnung: "Avocado", kategorie: "Obst", kcalPro100g: 160, proteinPro100g: 2, kohlenhydratePro100g: 2, fettPro100g: 15, standardPortionG: 70 },

  // Gemüse
  { bezeichnung: "Tomate", kategorie: "Gemüse", kcalPro100g: 18, proteinPro100g: 0.9, kohlenhydratePro100g: 2.6, fettPro100g: 0.2, standardPortionG: 120 },
  { bezeichnung: "Gurke", kategorie: "Gemüse", kcalPro100g: 13, proteinPro100g: 0.6, kohlenhydratePro100g: 1.8, fettPro100g: 0.2, standardPortionG: 150 },
  { bezeichnung: "Brokkoli", kategorie: "Gemüse", kcalPro100g: 30, proteinPro100g: 3.5, kohlenhydratePro100g: 2.7, fettPro100g: 0.4, standardPortionG: 200 },
  { bezeichnung: "Karotte", kategorie: "Gemüse", kcalPro100g: 30, proteinPro100g: 0.9, kohlenhydratePro100g: 5, fettPro100g: 0.2, standardPortionG: 100 },
  { bezeichnung: "Paprika, rot", kategorie: "Gemüse", kcalPro100g: 33, proteinPro100g: 1, kohlenhydratePro100g: 6.4, fettPro100g: 0.4, standardPortionG: 150 },
  { bezeichnung: "Kopfsalat", kategorie: "Gemüse", kcalPro100g: 14, proteinPro100g: 1.2, kohlenhydratePro100g: 1.1, fettPro100g: 0.2, standardPortionG: 50 },
  { bezeichnung: "Zucchini", kategorie: "Gemüse", kcalPro100g: 19, proteinPro100g: 1.6, kohlenhydratePro100g: 2.1, fettPro100g: 0.4, standardPortionG: 200 },
  { bezeichnung: "Spinat", kategorie: "Gemüse", kcalPro100g: 23, proteinPro100g: 2.9, kohlenhydratePro100g: 0.6, fettPro100g: 0.4, standardPortionG: 150 },

  // Nüsse, Samen & Öle
  { bezeichnung: "Mandeln", kategorie: "Nüsse & Öle", kcalPro100g: 600, proteinPro100g: 22, kohlenhydratePro100g: 5.5, fettPro100g: 54, standardPortionG: 30 },
  { bezeichnung: "Walnüsse", kategorie: "Nüsse & Öle", kcalPro100g: 680, proteinPro100g: 15, kohlenhydratePro100g: 7, fettPro100g: 66, standardPortionG: 30 },
  { bezeichnung: "Erdnussbutter", kategorie: "Nüsse & Öle", kcalPro100g: 600, proteinPro100g: 25, kohlenhydratePro100g: 13, fettPro100g: 50, standardPortionG: 20 },
  { bezeichnung: "Olivenöl", kategorie: "Nüsse & Öle", kcalPro100g: 880, proteinPro100g: 0, kohlenhydratePro100g: 0, fettPro100g: 100, standardPortionG: 10 },
  { bezeichnung: "Rapsöl", kategorie: "Nüsse & Öle", kcalPro100g: 880, proteinPro100g: 0, kohlenhydratePro100g: 0, fettPro100g: 100, standardPortionG: 10 },

  // Süßes & Snacks
  { bezeichnung: "Vollmilchschokolade", kategorie: "Süßes & Snacks", kcalPro100g: 540, proteinPro100g: 7, kohlenhydratePro100g: 56, fettPro100g: 31, standardPortionG: 25 },
  { bezeichnung: "Zartbitterschokolade 70 %", kategorie: "Süßes & Snacks", kcalPro100g: 560, proteinPro100g: 8, kohlenhydratePro100g: 34, fettPro100g: 42, standardPortionG: 25 },
  { bezeichnung: "Gummibärchen", kategorie: "Süßes & Snacks", kcalPro100g: 340, proteinPro100g: 7, kohlenhydratePro100g: 77, fettPro100g: 0.1, standardPortionG: 30 },
  { bezeichnung: "Kartoffelchips", kategorie: "Süßes & Snacks", kcalPro100g: 540, proteinPro100g: 6, kohlenhydratePro100g: 50, fettPro100g: 34, standardPortionG: 30 },

  // Gerichte
  { bezeichnung: "Pizza Margherita", kategorie: "Gerichte", kcalPro100g: 240, proteinPro100g: 10, kohlenhydratePro100g: 30, fettPro100g: 8.5, standardPortionG: 350 },
  { bezeichnung: "Döner Kebab", kategorie: "Gerichte", kcalPro100g: 215, proteinPro100g: 12, kohlenhydratePro100g: 20, fettPro100g: 9.5, standardPortionG: 350 },
  { bezeichnung: "Spaghetti Bolognese", kategorie: "Gerichte", kcalPro100g: 150, proteinPro100g: 7, kohlenhydratePro100g: 19, fettPro100g: 5, standardPortionG: 400 },

  // Getränke & Ergänzungen
  { bezeichnung: "Orangensaft", kategorie: "Getränke", kcalPro100g: 45, proteinPro100g: 0.7, kohlenhydratePro100g: 9, fettPro100g: 0.2, standardPortionG: 250 },
  { bezeichnung: "Cola", kategorie: "Getränke", kcalPro100g: 42, proteinPro100g: 0, kohlenhydratePro100g: 10.6, fettPro100g: 0, standardPortionG: 330 },
  { bezeichnung: "Cappuccino (Vollmilch)", kategorie: "Getränke", kcalPro100g: 40, proteinPro100g: 2, kohlenhydratePro100g: 3, fettPro100g: 2, standardPortionG: 200 },
  { bezeichnung: "Kaffee, schwarz", kategorie: "Getränke", kcalPro100g: 2, proteinPro100g: 0.2, kohlenhydratePro100g: 0.3, fettPro100g: 0, standardPortionG: 200 },
  { bezeichnung: "Bier (Pils)", kategorie: "Getränke", kcalPro100g: 42, proteinPro100g: 0.5, kohlenhydratePro100g: 3, fettPro100g: 0, standardPortionG: 500, enthaeltAlkohol: true },
  { bezeichnung: "Rotwein, trocken", kategorie: "Getränke", kcalPro100g: 70, proteinPro100g: 0.1, kohlenhydratePro100g: 0.5, fettPro100g: 0, standardPortionG: 200, enthaeltAlkohol: true },
  { bezeichnung: "Whey-Proteinpulver", kategorie: "Getränke", kcalPro100g: 380, proteinPro100g: 75, kohlenhydratePro100g: 7, fettPro100g: 6, standardPortionG: 30 },
];
