import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ADMIN_SESSION_COOKIE } from '../auth/auth.cookie';
import { AuthGuard } from '../auth/auth.guard';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { MenuService } from './menu.service';

@ApiTags('admin · carte')
@ApiCookieAuth(ADMIN_SESSION_COOKIE)
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('admin')
export class AdminMenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('categories')
  @ApiOkResponse({ description: 'Catégories de la carte, dans l’ordre' })
  listCategories() {
    return this.menuService.listCategories();
  }

  @Get('dishes')
  @ApiOkResponse({ description: 'Tous les plats, y compris indisponibles' })
  listDishes() {
    return this.menuService.listDishes();
  }

  @Post('dishes')
  @ApiCreatedResponse({ description: 'Plat créé' })
  createDish(@Body() dto: CreateDishDto) {
    return this.menuService.createDish(dto);
  }

  @Patch('dishes/:id')
  @ApiOkResponse({ description: 'Plat mis à jour' })
  updateDish(@Param('id') id: string, @Body() dto: UpdateDishDto) {
    return this.menuService.updateDish(id, dto);
  }

  @Delete('dishes/:id')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Plat supprimé' })
  deleteDish(@Param('id') id: string) {
    return this.menuService.deleteDish(id);
  }
}
