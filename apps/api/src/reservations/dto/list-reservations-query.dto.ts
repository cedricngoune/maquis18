import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

export class ListReservationsQueryDto {
  @ApiPropertyOptional({ example: '2026-11-20', description: 'Jour à afficher (par défaut : aujourd’hui, heure de Paris)' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La date doit être au format AAAA-MM-JJ.' })
  date?: string;
}
