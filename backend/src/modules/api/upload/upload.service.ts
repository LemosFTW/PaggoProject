import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { S3Service } from './s3.service';
import { GeminiService } from './gemini.service';
import { Express } from 'express';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    private geminiService: GeminiService,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
  ) {
    const fileKey = `${Date.now()}-${file.originalname}`;
    this.logger.log(`Iniciando upload para S3: key=${fileKey}`);

    const url = await this.s3Service.uploadFile(file, fileKey);
    this.logger.log(`Upload para S3 concluído: url=${url}`);

    const userFile = await this.prisma.userFile.create({
      data: {
        fileName: fileKey,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url,
        userId,
        text: null,
      },
    });
    this.logger.log(`Registro inicial do arquivo criado: id=${userFile.id}`);

    this.extractAndSaveText(userFile.id, url);

    return userFile;
  }

  private async extractAndSaveText(fileId: string, fileUrl: string) {
    this.logger.log(`Iniciando extração de texto para fileId: ${fileId}`);
    const extractedText = await this.geminiService.extractTextFromPdfUrl(fileUrl);

    if (extractedText !== null) {
      try {
        await this.prisma.userFile.update({
          where: { id: fileId },
          data: { text: extractedText },
        });
        this.logger.log(`Texto extraído e salvo para fileId: ${fileId}`);
      } catch (error) {
        this.logger.error(`Erro ao salvar texto extraído para fileId ${fileId}:`, error);
      }
    } else {
      this.logger.warn(`Não foi possível extrair texto para fileId: ${fileId}`);
    }
  }

  async getUserFiles(userId: string) {
    return this.prisma.userFile.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteUserFile(userId: string, fileId: string) {
    const fileToDelete = await this.prisma.userFile.findUnique({
      where: { id: fileId, userId: userId },
      select: { fileName: true },
    });

    if (!fileToDelete) {
      throw new NotFoundException('Arquivo não encontrado ou pertence a outro usuário.');
    }

    await this.s3Service.deleteFile(fileToDelete.fileName);

    await this.prisma.userFile.delete({
      where: { id: fileId },
    });

    return { message: 'Arquivo deletado com sucesso.' };
  }
} 