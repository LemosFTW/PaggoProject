import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, Request, Get, Delete, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import { memoryStorage } from 'multer';
import { Express } from 'express';

@Controller('api/upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user: { id: string } },
  ) {
    return this.uploadService.uploadFile(file, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserFiles(@Request() req: { user: { id: string } }) {
    return this.uploadService.getUserFiles(req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteUserFile(
    @Request() req: { user: { id: string } },
    @Param('id') fileId: string,
  ) {
    return this.uploadService.deleteUserFile(req.user.id, fileId);
  }
} 