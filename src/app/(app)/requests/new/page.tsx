import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NewRequestForm from "./_components/NewRequestForm";
import type { FormState } from "./_components/NewRequestForm";

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template } = await searchParams;

  let initialValues: Partial<FormState> | undefined;

  if (template) {
    const session = await getServerSession(authOptions);
    const tmpl = await prisma.diningRequest.findUnique({
      where: { id: template, userId: session!.user.id, status: "TEMPLATE" },
    });

    if (tmpl) {
      initialValues = {
        cuisinePrefs: tmpl.cuisinePrefs,
        drinkPrefs: tmpl.drinkPrefs,
        budgetPerPerson: tmpl.budgetPerPerson?.toString() ?? "",
        totalGuests: tmpl.totalGuests?.toString() ?? "",
        atmosphereNote: tmpl.atmosphereNote ?? "",
        privateRoom: tmpl.privateRoom ?? "",
        smokingPolicy: tmpl.smokingPolicy ?? "",
        preferredArea: tmpl.preferredArea ?? "",
        transportMode: tmpl.transportMode ?? "",
        locationPriority: tmpl.locationPriority ?? "",
        foodLikes: tmpl.foodLikes ?? "",
        foodDislikes: tmpl.foodDislikes ?? "",
        foodAbsoluteNg: tmpl.foodAbsoluteNg ?? "",
        ngConditions: tmpl.ngConditions.join("\n"),
      };
    }
  }

  return <NewRequestForm initialValues={initialValues} />;
}
