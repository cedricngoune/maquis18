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

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface CreateReservationRequest {
  /** Local date, format YYYY-MM-DD */
  date: string;
  /** Local time, format HH:mm */
  time: string;
  guests: number;
  name: string;
  phone: string;
}

export interface ReservationDto {
  id: string;
  date: string;
  time: string;
  guests: number;
  name: string;
  status: ReservationStatus;
}

export type ReservationField = keyof CreateReservationRequest;

/** Error body returned by the API: a general message plus optional per-field messages */
export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  /** Per-field messages, keyed by the request's property name */
  errors?: Record<string, string>;
}

// ---------- Admin ----------

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
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

export const DISH_TAGS: DishTag[] = ['HOMEMADE', 'SPICY', 'VEGETARIAN'];
