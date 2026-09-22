import { prisma } from "@/lib/prisma";
import { deleteReview } from "@/lib/actions/reviews";
import { DeleteButton } from "@/components/admin/delete-button";
import { getDict } from "@/i18n/get-dictionary";
import { pick } from "@/i18n/pick";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const [reviews, { locale, dict }] = await Promise.all([
    prisma.review.findMany({ include: { product: true }, orderBy: { createdAt: "desc" } }),
    getDict(),
  ]);
  const t = dict.admin.reviews;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>

      {reviews.length === 0 ? (
        <p className="text-sm text-muted">{t.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border bg-surface">
          <table className="w-full min-w-160 text-left text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{t.colProduct}</th>
                <th className="px-4 py-3 font-medium">{t.colAuthor}</th>
                <th className="px-4 py-3 font-medium">{t.colRating}</th>
                <th className="px-4 py-3 font-medium">{t.colText}</th>
                <th className="px-4 py-3 font-medium">{t.colDate}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reviews.map((r) => (
                <tr key={r.id} className="hover:bg-surface-muted">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {pick(r.product.name, r.product.nameRo, locale)}
                  </td>
                  <td className="px-4 py-3 text-foreground">{r.author}</td>
                  <td className="px-4 py-3 text-muted">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-muted" title={r.text}>
                    {r.text || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      <DeleteButton action={deleteReview.bind(null, r.id)} confirmText={t.deleteConfirm(r.author)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
