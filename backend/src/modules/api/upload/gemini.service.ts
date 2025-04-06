import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { S3Service } from './s3.service';

@Injectable()
export class GeminiService implements OnModuleInit {
  private genAI: GoogleGenAI;
  private readonly logger = new Logger(GeminiService.name);

  constructor(
    private configService: ConfigService,
    private s3Service: S3Service,
  ) {}

  onModuleInit() {
    const apiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenAI({ apiKey }); 
  }

  async extractTextFromPdfUrl(fileUrl: string): Promise<string | null> {
    this.logger.log(`Iniciando extração de texto para URL: ${fileUrl}`);
    try {
      const fileBuffer = await this.fetchFileFromS3Url(fileUrl);
      if (!fileBuffer) {
        this.logger.error('Falha ao buscar arquivo do S3.');
        return null;
      }

      const modelName = 'gemini-1.5-flash';

      const parts = [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: fileBuffer.toString('base64'),
          },
        },
        { text: "Extraia todo o texto contido neste documento PDF. Ao extrair multiplas linhas separe-as utilizando /n" },
      ];

      const result = await this.genAI.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts }],
      });

      const response = result.text;
      console.log(response);
      if (response) {
        return response;
      } else {
        return null;
      }

    } catch (error) {
      this.logger.error('Erro ao extrair texto do PDF com Gemini:', error);
      if (error.response) {
        this.logger.error('Detalhes da resposta do erro:', JSON.stringify(error.response, null, 2));
      }
      return null;
    }
  }

  private async fetchFileFromS3Url(fileUrl: string): Promise<Buffer | null> {
    const urlParts = new URL(fileUrl);
    const bucket = urlParts.hostname.split('.')[0];
    const key = urlParts.pathname.substring(1).replace(/\+/g, ' '); 

    if (!bucket || !key) {
      this.logger.error('Não foi possível extrair bucket/key da URL S3.');
      return null;
    }

    try {
      this.logger.log(`Buscando arquivo do S3: bucket=${bucket}, key=${key}`);
      const fileBuffer = await this.s3Service.getFileBuffer(key);
      this.logger.log('Arquivo buscado do S3 com sucesso.');
      return fileBuffer;
    } catch (error) {
      this.logger.error(`Erro ao buscar arquivo do S3: ${error.message}`);
      return null;
    }
  }
} 
