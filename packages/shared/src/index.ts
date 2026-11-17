export type DishTag = 'HOMEMADE' | 'SPICY' | 'VEGETARIAN';

export const DISH_TAG_LABELS: Record<DishTag, string> = {
  HOMEMADE: 'Fait maison',
  SPICY: 'Épicé',
  VEGETARIAN: 'Végétarien',
};

export interface DishDto {
  id: string;
  name: string;
  description: string;
  /** Price in cents, e.g. 1400 = 14,00 € */
  priceInCents: number;
  tags: DishTag[];
  imageUrl: string | null;
  isAvailable: boolean;
}

export interface MenuCategoryDto {
  id: string;
  name: string;
  slug: string;
  dishes: DishDto[];
}

export type MenuDto = MenuCategoryDto[];

export const formatPrice = (priceInCents: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(priceInCents / 100);

// ---------- Reservations ----------

export const MAX_GUESTS = 8;

/** Last table can be booked this many minutes before closing time */
export const LAST_BOOKING_BEFORE_CLOSING_MINUTES = 30;

/** Reservations are deleted automatically this many months after the meal (GDPR: limited retention) */
export const RESERVATION_RETENTION_MONTHS = 12;

/** Bookable times are on quarter hours: 19:00, 19:15, 19:30… */
export const SLOT_MINUTES = 15;

/** Cloudflare Turnstile public test key: always passes, for local development */
export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface CreateReservationRequest {
  /** Local date, format YYYY-MM-DD */
  date: string;
  /** Local time, format HH:mm */
  time: string;
  guests: number;
  name: string;
  phone: string;
  email: string;
  /** Token produced by the Cloudflare Turnstile widget */
  captchaToken: string;
  /** Honeypot: hidden from humans, must stay empty */
  website?: string;
}

export interface ReservationDto {
  id: string;
  date: string;
  time: string;
  guests: number;
  name: string;
  email: string | null;
  status: ReservationStatus;
}

export type ReservationField = keyof CreateReservationRequest;

/** What the customer sees on the cancellation page (no phone or e-mail: the link may be forwarded) */
export interface ManageReservationDto {
  date: string;
  time: string;
  guests: number;
  name: string;
  status: ReservationStatus;
  /** false once cancelled or once the meal time has passed */
  canCancel: boolean;
}

/** Error body returned by the API: a general message plus optional per-field messages */
export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  /** Per-field messages, keyed by the request's property name */
  errors?: Record<string, string>;
  /** When a slot is full: nearby times that still have room (HH:mm) */
  suggestedTimes?: string[];
}

// ---------- Admin ----------

export interface LoginRequest {
  email: string;
  password: string;
}

/** The JWT is not in the body: the API puts it in an httpOnly cookie that JavaScript cannot read */
export interface LoginResponse {
  admin: AdminProfileDto;
}

export interface AdminProfileDto {
  id: string;
  email: string;
}

export interface AdminReservationDto extends ReservationDto {
  phone: string;
  createdAt: string;
}

export interface UpdateReservationStatusRequest {
  status: ReservationStatus;
}

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
};

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
}

export interface AdminDishDto extends DishDto {
  categoryId: string;
}

export interface CreateDishRequest {
  name: string;
  description: string;
  priceInCents: number;
  tags: DishTag[];
  categoryId: string;
  isAvailable?: boolean;
  imageUrl?: string | null;
}

export type UpdateDishRequest = Partial<CreateDishRequest>;

export interface CategoryNameRequest {
  name: string;
}

export interface ReorderCategoriesRequest {
  /** Every category id, in the new display order */
  ids: string[];
}

/** Largest dish photo accepted by the API (before it is resized) */
export const MAX_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;

export const DISH_TAGS: DishTag[] = ['HOMEMADE', 'SPICY', 'VEGETARIAN'];

// ---------- Restaurant details (single source for the site, SEO, legal pages, e-mails and SMS) ----------

export const RESTAURANT = {
  name: 'Maquis 18',
  tagline: 'Cuisine guinéenne faite maison, Paris 18e',
  description:
    'Attiéké, foutou, mafé… des plats généreux préparés chaque jour avec des produits bio. Sur place ou à emporter, 7 j/7.',
  cuisines: ['Guinéenne', 'Africaine de l’Ouest'],
  address: {
    street: '[ADRESSE FICTIVE]',
    postalCode: '75018',
    city: 'Paris',
    country: 'FR',
  },
  metro: '[STATION LA PLUS PROCHE]',
  phone: { display: '01 55 10 62 63', e164: '+33155106263' },
  instagram: { handle: '@maquis18.paris', url: 'https://www.instagram.com/' },
  priceRange: '€',
} as const;

export const formatRestaurantAddress = () =>
  `${RESTAURANT.address.street}, ${RESTAURANT.address.postalCode} ${RESTAURANT.address.city}`;

// ---------- Opening hours (one opening window per day; a missing day means closed) ----------

export interface OpeningHourDto {
  /** 0 = Sunday … 6 = Saturday */
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
}

/** One row of the admin form: every day of the week, open or closed */
export interface OpeningDayInput extends OpeningHourDto {
  isOpen: boolean;
}

export interface UpdateOpeningHoursRequest {
  days: OpeningDayInput[];
}

export const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

/** French week order: Monday first */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Used by the site when the API can't be reached, and by the seed */
export const DEFAULT_OPENING_HOURS: OpeningHourDto[] = WEEK_ORDER.map((dayOfWeek) => ({
  dayOfWeek,
  opensAt: '11:00',
  closesAt: '22:00',
}));

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** "11:00" → "11 h", "21:30" → "21 h 30" */
export const formatTimeFr = (time: string): string => {
  const [hours, minutes] = time.split(':');
  return minutes === '00' ? `${Number(hours)} h` : `${Number(hours)} h ${minutes}`;
};

/** Day of week (0 = Sunday) of a "YYYY-MM-DD" date, whatever the time zone */
export const dayOfWeekOf = (isoDate: string): number => new Date(`${isoDate}T12:00:00Z`).getUTCDay();

/**
 * Human-readable opening hours, consecutive days with the same hours grouped together:
 * ["Tous les jours, 11 h – 22 h"] or ["Lundi – Vendredi : 11 h – 22 h", "Samedi : 12 h – 23 h", "Dimanche : fermé"]
 */
export function summarizeOpeningHours(hours: OpeningHourDto[]): string[] {
  const windowOf = (day: number) => {
    const hour = hours.find((candidate) => candidate.dayOfWeek === day);
    return hour ? `${formatTimeFr(hour.opensAt)} – ${formatTimeFr(hour.closesAt)}` : 'fermé';
  };

  const groups: { days: number[]; window: string }[] = [];
  for (const day of WEEK_ORDER) {
    const window = windowOf(day);
    const last = groups[groups.length - 1];
    if (last && last.window === window) last.days.push(day);
    else groups.push({ days: [day], window });
  }

  if (groups.length === 1) {
    return groups[0].window === 'fermé' ? ['Fermé'] : [`Tous les jours, ${groups[0].window}`];
  }
  return groups.map(({ days, window }) => {
    const label =
      days.length === 1 ? DAY_NAMES[days[0]] : `${DAY_NAMES[days[0]]} – ${DAY_NAMES[days[days.length - 1]]}`;
    return `${label} : ${window}`;
  });
}

export type TimeSlotGroup = { label: string; slots: string[] };

/**
 * Bookable quarter-hour slots of a given date, grouped for the time dropdown.
 * Returns null when the restaurant is closed that day.
 */
export function getBookableSlots(hours: OpeningHourDto[], isoDate: string): TimeSlotGroup[] | null {
  const hour = hours.find((candidate) => candidate.dayOfWeek === dayOfWeekOf(isoDate));
  if (!hour) return null;

  const first = timeToMinutes(hour.opensAt);
  const last = timeToMinutes(hour.closesAt) - LAST_BOOKING_BEFORE_CLOSING_MINUTES;
  const slots: string[] = [];
  for (let minutes = first; minutes <= last; minutes += SLOT_MINUTES) slots.push(minutesToTime(minutes));

  const groups: TimeSlotGroup[] = [
    { label: 'Midi', slots: slots.filter((slot) => slot < '15:00') },
    { label: 'Après-midi', slots: slots.filter((slot) => slot >= '15:00' && slot < '18:00') },
    { label: 'Soir', slots: slots.filter((slot) => slot >= '18:00') },
  ];
  return groups.filter((group) => group.slots.length > 0);
}
