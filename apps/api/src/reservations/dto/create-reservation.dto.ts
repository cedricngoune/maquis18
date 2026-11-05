import { ApiProperty } from '@nestjs/swagger';
import { MAX_GUESTS, type CreateReservationRequest } from '@maquis18/shared';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateReservationDto implements CreateReservationRequest {
  @ApiProperty({ example: '2026-11-20', description: 'Date locale (YYYY-MM-DD)' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La date doit être au format AAAA-MM-JJ.' })
  date: string;

  @ApiProperty({ example: '19:30', description: 'Heure locale (HH:mm)' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "L'heure doit être au format HH:mm." })
  time: string;

  @ApiProperty({ example: 2, minimum: 1, maximum: MAX_GUESTS })
  @IsInt({ message: 'Le nombre de personnes doit être un nombre entier.' })
  @Min(1, { message: 'Il faut au moins 1 personne.' })
  @Max(MAX_GUESTS, { message: `Au-delà de ${MAX_GUESTS} personnes, merci de nous appeler.` })
  guests: number;

  @ApiProperty({ example: 'Awa Diallo' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Merci d’indiquer votre nom.' })
  @MaxLength(80, { message: 'Le nom est trop long (80 caractères maximum).' })
  name: string;

  @ApiProperty({ example: '06 12 34 56 78' })
  @Transform(trim)
  @Matches(/^(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}$/, {
    message: 'Merci d’indiquer un numéro de téléphone français valide.',
  })
  phone: string;
}
