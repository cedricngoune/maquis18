import { ApiProperty } from '@nestjs/swagger';
import type { LoginRequest } from '@maquis18/shared';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto implements LoginRequest {
  @ApiProperty({ example: 'admin@maquis18.fr' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Merci d’indiquer une adresse e-mail valide.' })
  email: string;

  @ApiProperty({ example: 'motdepasse' })
  @IsString()
  @IsNotEmpty({ message: 'Merci d’indiquer votre mot de passe.' })
  password: string;
}
