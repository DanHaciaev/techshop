"use server";

import { z } from "zod";
import { updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TAGS } from "@/lib/data";

const reviewSchema = z.object({
  author: z.string().trim().min(2, "Введите имя").max(60),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().max(2000).optional().default(""),
});

export async function createReview(productId: string, formData: FormData) {
  const parsed = reviewSchema.parse(Object.fromEntries(formData));
  await prisma.review.create({
    data: {
      productId,
      author: parsed.author,
      rating: parsed.rating,
      text: parsed.text,
    },
  });
  updateTag(TAGS.reviews);
}

export async function deleteReview(id: string) {
  await prisma.review.delete({ where: { id } });
  updateTag(TAGS.reviews);
}
