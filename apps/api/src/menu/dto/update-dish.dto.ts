import { PartialType } from '@nestjs/swagger';
import { CreateDishDto } from './create-dish.dto';

/** Same rules as CreateDishDto, but every field becomes optional */
export class UpdateDishDto extends PartialType(CreateDishDto) {}
