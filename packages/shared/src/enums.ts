import { z } from "zod";

export const CarCondition = z.enum(["ZERO_KM", "USED"]);
export const CarStatus = z.enum(["AVAILABLE", "RESERVED", "SOLD"]);
export const Currency = z.enum(["ARS", "USD"]);
export const Fuel = z.enum(["NAFTA", "DIESEL", "GNC", "HIBRIDO", "ELECTRICO"]);
export const Transmission = z.enum(["MANUAL", "AUTOMATICA"]);
export const Role = z.enum(["ADMIN", "EDITOR"]);

export type CarConditionT = z.infer<typeof CarCondition>;
export type CarStatusT = z.infer<typeof CarStatus>;
export type CurrencyT = z.infer<typeof Currency>;
export type FuelT = z.infer<typeof Fuel>;
export type TransmissionT = z.infer<typeof Transmission>;
export type RoleT = z.infer<typeof Role>;
