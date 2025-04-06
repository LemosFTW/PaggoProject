import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service implements OnModuleInit {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.region = this.configService.getOrThrow<string>('AWS_REGION');
    const accessKeyId = this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.getOrThrow<string>('AWS_SECRET_ACCESS_KEY');
    this.bucket = this.configService.getOrThrow<string>('AWS_S3_BUCKET');

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);
    
    await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key.replaceAll(' ', '+')}`;
  }

  async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.s3Client.send(command);
  }

  async getFileBuffer(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const response = await this.s3Client.send(command);
    const stream = response.Body as NodeJS.ReadableStream;
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk as Buffer));
      stream.once('end', () => resolve(Buffer.concat(chunks)));
      stream.once('error', reject);
    });
  }
} 