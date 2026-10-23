import type { CarInput } from "@batalla/shared";

const DEMO = " Unidad de ejemplo para la demo: datos y precios ficticios.";

type SeedCar = Omit<CarInput, "description" | "status" | "featured" | "onOffer"> &
  Partial<Pick<CarInput, "status" | "featured" | "onOffer" | "offerPrice">> & { description: string };

// Todos los datos son FICTICIOS (demo). No representan stock ni precios reales.
export const seedCars: SeedCar[] = [
  {
    brand: "Fiat", model: "Cronos", version: "Drive 1.3 GSE Pack Plus", year: 2025, condition: "ZERO_KM",
    priceAmount: 24_500_000, priceCurrency: "ARS", fuel: "NAFTA", transmission: "MANUAL",
    bodyType: "Sedán", color: "Gris Silverstone", doors: 4, engine: "1.3 GSE 99 CV",
    description: "Sedán familiar con gran baúl, pantalla multimedia y cámara de estacionamiento." + DEMO,
    featured: true,
  },
  {
    brand: "Fiat", model: "Cronos", version: "Precision 1.3 CVT", year: 2025, condition: "ZERO_KM",
    priceAmount: 28_900_000, priceCurrency: "ARS", fuel: "NAFTA", transmission: "AUTOMATICA",
    bodyType: "Sedán", color: "Blanco Banchisa", doors: 4, engine: "1.3 GSE 99 CV",
    description: "Versión automática CVT con llantas de aleación y climatizador." + DEMO,
  },
  {
    brand: "Volkswagen", model: "Polo", version: "Track 1.6 MSI", year: 2024, condition: "USED",
    priceAmount: 15_500, priceCurrency: "USD", mileageKm: 18_000, fuel: "NAFTA", transmission: "MANUAL",
    bodyType: "Hatchback", color: "Rojo", doors: 5, engine: "1.6 MSI 110 CV",
    description: "Único dueño, service oficial al día." + DEMO,
  },
  {
    brand: "Toyota", model: "Corolla", version: "XEI 2.0 CVT", year: 2021, condition: "USED",
    priceAmount: 24_800, priceCurrency: "USD", mileageKm: 62_000, fuel: "NAFTA", transmission: "AUTOMATICA",
    bodyType: "Sedán", color: "Gris Oscuro", doors: 4, engine: "2.0 Dual VVT-i 170 CV",
    description: "Muy buen estado, cubiertas nuevas." + DEMO,
  },
  {
    brand: "Toyota", model: "Hilux", version: "SRV 4x4 2.8 TDI AT", year: 2022, condition: "USED",
    priceAmount: 42_000, priceCurrency: "USD", mileageKm: 54_000, fuel: "DIESEL", transmission: "AUTOMATICA",
    bodyType: "Pick-up", color: "Blanco", doors: 4, engine: "2.8 TDI 204 CV",
    description: "Pick-up doble cabina 4x4, lista para trabajo o viaje." + DEMO,
    featured: true,
  },
  {
    brand: "Audi", model: "A3", version: "Sedán 35 TFSI S tronic", year: 2020, condition: "USED",
    priceAmount: 28_500, priceCurrency: "USD", mileageKm: 48_000, fuel: "NAFTA", transmission: "AUTOMATICA",
    bodyType: "Sedán", color: "Negro Mythos", doors: 4, engine: "1.4 TFSI 150 CV",
    description: "Cuero, techo solar y Virtual Cockpit." + DEMO,
  },
  {
    brand: "Audi", model: "Q3", version: "35 TFSI S tronic", year: 2022, condition: "USED",
    priceAmount: 41_000, priceCurrency: "USD", mileageKm: 31_000, fuel: "NAFTA", transmission: "AUTOMATICA",
    bodyType: "SUV", color: "Gris Nano", doors: 5, engine: "1.4 TFSI 150 CV",
    description: "SUV premium en excelente estado." + DEMO,
    onOffer: true, offerPrice: 39_500,
  },
  {
    brand: "Mercedes-Benz", model: "Clase C", version: "C 200 Avantgarde", year: 2019, condition: "USED",
    priceAmount: 36_500, priceCurrency: "USD", mileageKm: 72_000, fuel: "NAFTA", transmission: "AUTOMATICA",
    bodyType: "Sedán", color: "Plata", doors: 4, engine: "2.0 Turbo 184 CV",
    description: "Service oficial, interior en cuero." + DEMO,
  },
  {
    brand: "Mercedes-Benz", model: "GLA", version: "GLA 200", year: 2021, condition: "USED",
    priceAmount: 44_900, priceCurrency: "USD", mileageKm: 39_000, fuel: "NAFTA", transmission: "AUTOMATICA",
    bodyType: "SUV", color: "Blanco Polar", doors: 5, engine: "1.3 Turbo 163 CV",
    description: "SUV compacta con pantalla MBUX." + DEMO,
    featured: true,
  },
  {
    brand: "Peugeot", model: "208", version: "Allure 1.6", year: 2023, condition: "USED",
    priceAmount: 14_200, priceCurrency: "USD", mileageKm: 22_000, fuel: "NAFTA", transmission: "MANUAL",
    bodyType: "Hatchback", color: "Azul", doors: 5, engine: "1.6 VTi 115 CV",
    description: "Ideal para ciudad, bajo consumo." + DEMO,
  },
  {
    brand: "Renault", model: "Duster", version: "Intens 1.6", year: 2020, condition: "USED",
    priceAmount: 13_900, priceCurrency: "USD", mileageKm: 85_000, fuel: "NAFTA", transmission: "MANUAL",
    bodyType: "SUV", color: "Naranja Atacama", doors: 5, engine: "1.6 SCe 114 CV",
    description: "Equipada, con GNC de quinta generación." + DEMO,
    status: "RESERVED",
  },
  {
    brand: "Chevrolet", model: "Onix", version: "Premier 1.0 Turbo AT", year: 2022, condition: "USED",
    priceAmount: 14_800, priceCurrency: "USD", mileageKm: 40_000, fuel: "NAFTA", transmission: "AUTOMATICA",
    bodyType: "Hatchback", color: "Gris", doors: 5, engine: "1.0 Turbo 116 CV",
    description: "Muy buen equipamiento de seguridad." + DEMO,
  },
  {
    brand: "Ford", model: "Ranger", version: "XLT 3.2 4x4", year: 2018, condition: "USED",
    priceAmount: 28_000, priceCurrency: "USD", mileageKm: 120_000, fuel: "DIESEL", transmission: "MANUAL",
    bodyType: "Pick-up", color: "Blanco", doors: 4, engine: "3.2 TDCi 200 CV",
    description: "Vendida (ejemplo de unidad con estado Vendido, no se muestra en el sitio)." + DEMO,
    status: "SOLD",
  },
];
