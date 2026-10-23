import type { CarConditionT, CarStatusT, CurrencyT, FuelT, TransmissionT } from "@batalla/shared";

export interface PhotoDTO {
  id: string;
  position: number;
  alt: string;
  isCover: boolean;
  width: number;
  height: number;
  urls: { w480: string; w960: string; w1600: string };
}

export interface SpinFrameDTO {
  id: string;
  position: number;
  width: number;
  height: number;
  urls: { w480: string; w800: string; w1280: string };
}

export interface CarDTO {
  id: string;
  slug: string;
  brand: string;
  model: string;
  version: string | null;
  year: number;
  condition: CarConditionT;
  priceAmount: number;
  priceCurrency: CurrencyT;
  mileageKm: number | null;
  fuel: FuelT;
  transmission: TransmissionT;
  bodyType: string | null;
  color: string | null;
  doors: number | null;
  engine: string | null;
  description: string;
  status: CarStatusT;
  featured: boolean;
  onOffer: boolean;
  offerPrice: number | null;
  photos: PhotoDTO[];
  spin: { status: "DRAFT" | "READY"; frameCount: number; frames: SpinFrameDTO[] } | null;
}

export interface CarList {
  items: CarDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CarFilters {
  brands: { brand: string; models: string[] }[];
  year: { min: number | null; max: number | null };
  price: { min: number | null; max: number | null };
  mileageKmMax: number | null;
}
