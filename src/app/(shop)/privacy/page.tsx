import { getSettings } from "@/lib/data";
import { L } from "@/i18n/l";
import { dictionaries } from "@/i18n/dictionaries";

export const revalidate = 3600;

export const metadata = { title: dictionaries.ru.legal.privacyTitle };

export default async function PrivacyPage() {
  const settings = await getSettings();
  const name = settings.shopName;
  const email = settings.email;

  const sections: { heading: { ru: string; ro: string }; paragraphs: { ru: string; ro: string }[] }[] = [
    {
      heading: { ru: "1. Какие данные мы собираем", ro: "1. Ce date colectăm" },
      paragraphs: [
        {
          ru: "При оформлении заказа мы собираем: имя, номер телефона, email (по желанию), адрес доставки или выбранный магазин для самовывоза, а также состав и сумму заказа.",
          ro: "La plasarea comenzii colectăm: numele, numărul de telefon, emailul (opțional), adresa de livrare sau magazinul ales pentru ridicare, precum și conținutul și suma comenzii.",
        },
        {
          ru: "Сайт также сохраняет в браузере технические данные: содержимое корзины и выбранный язык интерфейса — исключительно для удобства использования сайта.",
          ro: "Site-ul salvează în browser și date tehnice: conținutul coșului și limba interfeței alese — exclusiv pentru comoditatea utilizării site-ului.",
        },
      ],
    },
    {
      heading: { ru: "2. Как мы используем данные", ro: "2. Cum folosim datele" },
      paragraphs: [
        {
          ru: `Данные используются исключительно для обработки и доставки заказа, связи с покупателем по вопросам заказа и улучшения качества обслуживания магазина «${name}». Мы не передаём персональные данные третьим лицам, за исключением служб доставки, необходимых для выполнения заказа.`,
          ro: `Datele sunt folosite exclusiv pentru procesarea și livrarea comenzii, comunicarea cu cumpărătorul referitor la comandă și îmbunătățirea calității serviciilor magazinului «${name}». Nu transmitem date personale unor terți, cu excepția serviciilor de curierat necesare pentru onorarea comenzii.`,
        },
      ],
    },
    {
      heading: { ru: "3. Хранение данных", ro: "3. Stocarea datelor" },
      paragraphs: [
        {
          ru: "Данные заказов хранятся в течение срока, необходимого для выполнения обязательств перед покупателем и требований законодательства, после чего могут быть удалены по запросу.",
          ro: "Datele comenzilor sunt păstrate pe perioada necesară pentru îndeplinirea obligațiilor față de cumpărător și a cerințelor legale, după care pot fi șterse la cerere.",
        },
      ],
    },
    {
      heading: { ru: "4. Ваши права", ro: "4. Drepturile dumneavoastră" },
      paragraphs: [
        {
          ru: `Вы вправе запросить доступ к своим персональным данным, их исправление или удаление, обратившись по адресу ${email}.`,
          ro: `Aveți dreptul să solicitați acces la datele dvs. personale, corectarea sau ștergerea acestora, contactându-ne la adresa ${email}.`,
        },
      ],
    },
    {
      heading: { ru: "5. Файлы cookie", ro: "5. Fișiere cookie" },
      paragraphs: [
        {
          ru: "Сайт использует технически необходимые cookie-файлы для работы корзины, сохранения выбранной темы оформления и языка интерфейса. Мы не используем рекламные или аналитические cookie-файлы сторонних сервисов.",
          ro: "Site-ul folosește fișiere cookie strict necesare pentru funcționarea coșului, salvarea temei alese și a limbii interfeței. Nu folosim cookie-uri publicitare sau de analiză de la servicii terțe.",
        },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
        <L ru={dictionaries.ru.legal.privacyTitle} ro={dictionaries.ro.legal.privacyTitle} />
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
