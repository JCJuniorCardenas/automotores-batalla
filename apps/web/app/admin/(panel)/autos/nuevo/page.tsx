import { CarForm } from "@/components/admin/CarForm";

export const metadata = { title: "Nuevo auto" };

export default function NewCarPage() {
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Nuevo auto</h1>
      <CarForm />
    </>
  );
}
