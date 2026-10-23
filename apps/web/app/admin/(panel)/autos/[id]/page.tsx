"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CarForm } from "@/components/admin/CarForm";
import { PhotoManager } from "@/components/admin/PhotoManager";
import { SpinManager } from "@/components/admin/SpinManager";
import { AdminApiError, adminFetch } from "@/lib/admin-api";
import { carTitle } from "@/lib/format";
import type { CarDTO } from "@/lib/types";

export default function EditCarPage() {
  const { id } = useParams<{ id: string }>();
  const [car, setCar] = useState<CarDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<CarDTO>(`/admin/cars/${id}`)
      .then(setCar)
      .catch((e) => setError(e instanceof AdminApiError && e.status === 404 ? "Auto no encontrado" : "No pudimos cargar el auto"));
  }, [id]);

  if (error) return <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-red-700">{error}</p>;
  if (!car) return <p className="text-black/60">Cargando…</p>;
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">{carTitle(car)} {car.year}</h1>
      <CarForm car={car} />
      <PhotoManager carId={car.id} initial={car.photos} />
      <SpinManager carId={car.id} initial={car.spin} />
    </>
  );
}
