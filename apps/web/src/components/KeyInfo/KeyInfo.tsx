import { DAY_NAMES, WEEK_ORDER, formatTimeFr, type OpeningHourDto } from '@maquis18/shared';
import styles from './KeyInfo.module.css';

type KeyInfoProps = {
  openingHours: OpeningHourDto[];
};

/** "7 j/7 · De 11 h à 22 h", or "6 j/7 · Fermé le dimanche" when the hours differ from day to day */
function openingFact(hours: OpeningHourDto[]) {
  const title = `${hours.length} j/7`;
  const sameEveryDay = hours.every(
    (hour) => hour.opensAt === hours[0]?.opensAt && hour.closesAt === hours[0]?.closesAt,
  );

  if (hours.length === 0) return { title: 'Fermé', detail: 'Temporairement' };
  if (hours.length === 7 && sameEveryDay) {
    return { title, detail: `De ${formatTimeFr(hours[0].opensAt)} à ${formatTimeFr(hours[0].closesAt)}` };
  }
  const closedDays = WEEK_ORDER.filter((day) => !hours.some((hour) => hour.dayOfWeek === day));
  if (closedDays.length === 1 && sameEveryDay) {
    return { title, detail: `Fermé le ${DAY_NAMES[closedDays[0]].toLowerCase()}` };
  }
  return { title, detail: 'Voir nos horaires' };
}

const OTHER_FACTS = [
  { title: 'Dès 10 €', detail: 'Des plats généreux' },
  { title: 'Bio & maison', detail: 'Préparé chaque jour' },
  { title: 'Sur place', detail: 'ou à emporter' },
];

export function KeyInfo({ openingHours }: KeyInfoProps) {
  const facts = [openingFact(openingHours), ...OTHER_FACTS];

  return (
    <section aria-label="Informations clés" className={styles.band}>
      <ul className={`container ${styles.list}`}>
        {facts.map((fact) => (
          <li key={fact.title} className={styles.item}>
            <span className={styles.title}>{fact.title}</span>
            <span>{fact.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
