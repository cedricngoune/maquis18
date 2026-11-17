import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ADMIN_SESSION_COOKIE } from '../auth/auth.cookie';
import { AuthGuard } from '../auth/auth.guard';
import { MAX_IMAGE_UPLOAD_BYTES, type ApiErrorResponse } from '@maquis18/shared';
import { CategoryNameDto, ReorderCategoriesDto } from './dto/category.dto';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';
import { MenuService } from './menu.service';

/** The part of the Multer file object we use (kept in memory, then re-encoded by StorageService) */
type UploadedImage = { buffer: Buffer; size: number; mimetype: string };

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

  // ---------- Categories ----------

  @Post('categories')
  @ApiCreatedResponse({ description: 'Catégorie créée, en dernière position' })
  createCategory(@Body() dto: CategoryNameDto) {
    return this.menuService.createCategory(dto.name);
  }

  @Patch('categories/:id')
  @ApiOkResponse({ description: 'Catégorie renommée' })
  renameCategory(@Param('id') id: string, @Body() dto: CategoryNameDto) {
    return this.menuService.renameCategory(id, dto.name);
  }

  @Post('categories/reorder')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Nouvel ordre enregistré' })
  reorderCategories(@Body() dto: ReorderCategoriesDto) {
    return this.menuService.reorderCategories(dto.ids);
  }

  @Delete('categories/:id')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Catégorie supprimée' })
  @ApiConflictResponse({ description: 'La catégorie contient encore des plats' })
  deleteCategory(@Param('id') id: string) {
    return this.menuService.deleteCategory(id);
  }

  // ---------- Dish photos ----------

  @Post('dishes/:id/image')
  @HttpCode(200)
  // Multer keeps the file in memory (Buffer); StorageService re-encodes it before writing to disk
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: MAX_IMAGE_UPLOAD_BYTES, files: 1 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { image: { type: 'string', format: 'binary' } } } })
  @ApiOkResponse({ description: 'Photo enregistrée (convertie en WebP)' })
  uploadDishImage(@Param('id') id: string, @UploadedFile() file?: UploadedImage) {
    if (!file) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Aucune image reçue.',
        errors: { image: 'Choisissez une image à envoyer.' },
      } satisfies ApiErrorResponse);
    }
    return this.menuService.setDishImage(id, file.buffer);
  }

  @Delete('dishes/:id/image')
  @ApiOkResponse({ description: 'Photo retirée' })
  removeDishImage(@Param('id') id: string) {
    return this.menuService.removeDishImage(id);
  }
}
