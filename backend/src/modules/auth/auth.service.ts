import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const tokens = await this.generateTokens(user.id, user.email);

    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) 
      throw new UnauthorizedException('Email já cadastrado');
    

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        name: registerDto.name,
        password: hashedPassword,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email);

    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      // Buscar o token no banco de dados
      const refreshTokenData = await this.prisma.refreshToken.findUnique({
        where: { token: refreshTokenDto.refreshToken },
        include: { user: true },
      });

      // Verificar se o token existe e não está expirado ou revogado
      if (!refreshTokenData || refreshTokenData.revoked || new Date() > refreshTokenData.expiresAt) {
        throw new ForbiddenException('Refresh token inválido ou expirado');
      }

      // Verificar se o token é válido 
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      });

      // Verificar se o usuário do token é o mesmo do banco
      if (payload.sub !== refreshTokenData.userId) {
        throw new ForbiddenException('Refresh token inválido');
      }

      // Gerar novos tokens
      const tokens = await this.generateTokens(refreshTokenData.user.id, refreshTokenData.user.email);

      // Revogar o token antigo
      await this.prisma.refreshToken.update({
        where: { id: refreshTokenData.id },
        data: { revoked: true },
      });

      // Salvar o novo refresh token
      await this.saveRefreshToken(refreshTokenData.user.id, tokens.refreshToken);

      return {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      };
    } catch (error) {
      throw new ForbiddenException('Não foi possível renovar o token: ' + error.message);
    }
  }

  async logout(userId: string, refreshToken: string) {
    // Marcar o refresh token como revogado
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        token: refreshToken,
      },
      data: {
        revoked: true,
      },
    });

    return { message: 'Logout realizado com sucesso' };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = 
    { 
      sub: userId,
      email : email 
    };

    // Invalida após 15 minutos
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('REFRESH_TOKEN_SECRET'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, token: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }
}
