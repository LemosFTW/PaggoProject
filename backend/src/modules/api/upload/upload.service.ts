import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { S3Service } from './s3.service';
import { Express } from 'express';

@Injectable()
export class UploadService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
  ) {
    // Gerar um nome único para o arquivo
    const fileKey = `${userId}-${Date.now()}-${file.originalname}`;

    // Upload para o S3
    const url = await this.s3Service.uploadFile(file, fileKey);

    // Salvar informações no banco de dados
    const userFile = await this.prisma.userFile.create({
      data: {
        fileName: fileKey,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url,
        userId,
      },
    });

    return userFile;
  }

  async getUserFiles(userId: string) {
    return this.prisma.userFile.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteUserFile(userId: string, fileId: string) {
    // 1. Encontrar o arquivo no banco de dados para obter a chave S3 (fileName)
    const fileToDelete = await this.prisma.userFile.findUnique({
      where: { id: fileId, userId: userId }, // Garante que o usuário só possa deletar seus próprios arquivos
      select: { fileName: true }, // Seleciona apenas o nome do arquivo (chave S3)
    });

    if (!fileToDelete) {
      throw new NotFoundException('Arquivo não encontrado ou pertence a outro usuário.');
    }

    // 2. Deletar o arquivo do S3
    await this.s3Service.deleteFile(fileToDelete.fileName);

    // 3. Deletar o registro do banco de dados
    await this.prisma.userFile.delete({
      where: { id: fileId },
    });

    return { message: 'Arquivo deletado com sucesso.' };
  }
} 