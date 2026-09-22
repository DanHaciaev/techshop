import { getSettings } from "@/lib/data";
import { L } from "@/i18n/l";
import { dictionaries } from "@/i18n/dictionaries";

export const revalidate = 3600;

export const metadata = { title: dictionaries.ru.legal.termsTitle };

export default async function TermsPage() {
  const settings = await getSettings();
  const name = settings.shopName;

  const sections: { heading: { ru: string; ro: string }; paragraphs: { ru: string; ro: string }[] }[] = [
    {
      heading: { ru: "1. Общие положения", ro: "1. Dispoziții generale" },
      paragraphs: [
        {
          ru: `Настоящие условия использования регулируют порядок пользования сайтом и услугами интернет-магазина «${name}». Оформляя заказ на сайте, вы подтверждаете согласие с изложенными ниже условиями.`,
          ro: `Acești termeni de utilizare reglementează modul de utilizare a site-ului și serviciilor magazinului online «${name}». Plasând o comandă pe site, confirmați acordul cu termenii de mai jos.`,
        },
        {
          ru: "Администрация сайта оставляет за собой право изменять данные условия в любое время без предварительного уведомления. Актуальная версия всегда доступна на этой странице.",
          ro: "Administrația site-ului își rezervă dreptul de a modifica acești termeni în orice moment, fără notificare prealabilă. Versiunea actuală este mereu disponibilă pe această pagină.",
        },
      ],
    },
    {
      heading: { ru: "2. Оформление заказа", ro: "2. Plasarea comenzii" },
      paragraphs: [
        {
          ru: "Заказ считается принятым к обработке после подтверждения менеджером по телефону или через контактные данные, указанные при оформлении. Наличие товара и цена подтверждаются на этапе обработки заказа.",
          ro: "Comanda este considerată acceptată spre procesare după confirmarea de către manager prin telefon sau prin datele de contact indicate la comandă. Disponibilitatea produsului și prețul se confirmă la procesarea comenzii.",
        },
        {
          ru: "Способ получения — доставка или самовывоз из магазина — выбирается покупателем при оформлении заказа.",
          ro: "Modalitatea de primire — livrare sau ridicare din magazin — este aleasă de cumpărător la plasarea comenzii.",
        },
      ],
    },
    {
      heading: { ru: "3. Оплата", ro: "3. Plata" },
      paragraphs: [
        {
          ru: "Оплата производится наличными или картой при получении товара, если иное не согласовано с менеджером магазина.",
          ro: "Plata se efectuează cu numerar sau card la primirea produsului, dacă nu s-a convenit altfel cu managerul magazinului.",
        },
      ],
    },
    {
      heading: { ru: "4. Возврат и обмен", ro: "4. Returnare și schimb" },
      paragraphs: [
        {
          ru: "Возврат и обмен товара надлежащего качества возможны в течение 14 дней с момента покупки при сохранении товарного вида, упаковки и документов, подтверждающих покупку, в соответствии с действующим законодательством о защите прав потребителей.",
          ro: "Returnarea și schimbul produsului de calitate corespunzătoare sunt posibile în termen de 14 zile de la achiziție, cu păstrarea aspectului comercial, ambalajului și documentelor care confirmă achiziția, conform legislației în vigoare privind protecția consumatorilor.",
        },
        {
          ru: "Товар с производственным браком подлежит гарантийному ремонту, замене или возврату денежных средств согласно гарантийным обязательствам производителя.",
          ro: "Produsul cu defect de fabricație este supus reparației în garanție, înlocuirii sau rambursării, conform obligațiilor de garanție ale producătorului.",
        },
      ],
    },
    {
      heading: { ru: "5. Ответственность", ro: "5. Responsabilitate" },
      paragraphs: [
        {
          ru: "Магазин не несёт ответственности за незначительное расхождение цветов и характеристик товара на фотографиях с реальным товаром, вызванное особенностями отображения на экранах устройств.",
          ro: "Magazinul nu răspunde pentru diferențele minore de culoare și caracteristici ale produsului din fotografii față de produsul real, cauzate de particularitățile de afișare a ecranelor.",
        },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
        <L ru={dictionaries.ru.legal.termsTitle} ro={dictionaries.ro.legal.termsTitle} />
      </h1>
      <p className="mt-2 text-sm text-muted">
        <L ru={dictionaries.ru.legal.lastUpdated} ro={dictionaries.ro.legal.lastUpdated} />
      </p>

      <div className="mt-8 flex flex-col gap-8">
        {sections.map((s, i) => (
          <section key={i}>
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              <L ru={s.heading.ru} ro={s.heading.ro} />
            </h2>
            <div className="flex flex-col gap-2">
              {s.paragraphs.map((p, j) => (
                <p key={j} className="leading-relaxed text-muted">
                  <L ru={p.ru} ro={p.ro} />
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
