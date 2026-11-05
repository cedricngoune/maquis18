import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DISH_TAGS, type CreateDishRequest, type DishTag } from '@maquis18/shared';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength, Min } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateDishDto implements CreateDishRequest {
  @ApiProperty({ example: 'Poulet yassa' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Le nom du plat est obligatoire.' })
  @MaxLength(80, { message: 'Le nom est trop long (80 caractères maximum).' })
  name: string;

  @ApiProperty({ example: 'Poulet mariné au citron et aux oignons confits, riz parfumé.' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'La description est obligatoire.' })
  @MaxLength(300, { message: 'La description est trop longue (300 caractères maximum).' })
  description: string;

  @ApiProperty({ example: 1200, description: 'Prix en centimes' })
  @IsInt({ message: 'Le prix doit être un nombre entier de centimes.' })
  @Min(0, { message: 'Le prix ne peut pas être négatif.' })
  priceInCents: number;

  @ApiProperty({ enum: DISH_TAGS, isArray: true, example: ['HOMEMADE'] })
  @IsArray()
  @IsIn(DISH_TAGS, { each: true, message: 'Étiquette inconnue.' })
  tags: DishTag[];

  @ApiProperty({ description: 'Identifiant de la catégorie' })
  @IsString()
  @IsNotEmpty({ message: 'Merci de choisir une catégorie.' })
  categoryId: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ example: 'https://images.example.com/yassa.jpg', nullable: true })
  @IsOptional()
  @IsUrl({}, { message: 'L’adresse de l’image doit être une URL valide.' })
  imageUrl?: string | null;
}
