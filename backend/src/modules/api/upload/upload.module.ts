import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { S3Service } from './s3.service';
import { GeminiService } from './gemini.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [UploadController],
  providers: [
    UploadService,
    S3Service,
    GeminiService,
    PrismaService,
  ],
  exports: [UploadService],
})
export class UploadModule {} 