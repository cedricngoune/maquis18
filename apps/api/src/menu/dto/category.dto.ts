import { ApiProperty } from '@nestjs/swagger';
import type { CategoryNameRequest, ReorderCategoriesRequest } from '@maquis18/shared';
import { Transform } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CategoryNameDto implements CategoryNameRequest {
  @ApiProperty({ example: 'Grillades' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Le nom de la catégorie est obligatoire.' })
  @MaxLength(40, { message: 'Le nom est trop long (40 caractères maximum).' })
  name: string;
}

export class ReorderCategoriesDto implements ReorderCategoriesRequest {
  @ApiProperty({ type: [String], description: 'Tous les identifiants de catégories, dans le nouvel ordre' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids: string[];
}
