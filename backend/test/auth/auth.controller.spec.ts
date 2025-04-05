import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/modules/auth/auth.controller';
import { AuthService } from '../../src/modules/auth/auth.service';
import { LoginDto } from '../../src/modules/auth/dto/login.dto';
import { RegisterDto } from '../../src/modules/auth/dto/register.dto';
import { RefreshTokenDto } from '../../src/modules/auth/dto/refresh-token.dto';
import { JwtAuthGuard } from '../../src/modules/auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

// Interface para o tipo de requisição com usuário
interface RequestWithUser extends Request {
  user: { id: string; email: string };
}

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1d' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
            refreshToken: jest.fn(),
            logout: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockResponse = {
      access_token: 'mockAccessToken',
      refresh_token: 'mockRefreshToken',
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      },
    };

    it('should call authService.login with correct parameters', async () => {
      jest.spyOn(authService, 'login').mockResolvedValue(mockResponse);

      await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should return the response from authService.login', async () => {
      jest.spyOn(authService, 'login').mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const mockResponse = {
      access_token: 'mockAccessToken',
      refresh_token: 'mockRefreshToken',
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      },
    };

    it('should call authService.register with correct parameters', async () => {
      jest.spyOn(authService, 'register').mockResolvedValue(mockResponse);

      await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should return the response from authService.register', async () => {
      jest.spyOn(authService, 'register').mockResolvedValue(mockResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'mockRefreshToken',
    };

    const mockResponse = {
      access_token: 'newAccessToken',
      refresh_token: 'newRefreshToken',
    };

    it('should call authService.refreshToken with correct parameters', async () => {
      jest.spyOn(authService, 'refreshToken').mockResolvedValue(mockResponse);

      await controller.refreshToken(refreshTokenDto);

      expect(authService.refreshToken).toHaveBeenCalledWith(refreshTokenDto);
    });

    it('should return the response from authService.refreshToken', async () => {
      jest.spyOn(authService, 'refreshToken').mockResolvedValue(mockResponse);

      const result = await controller.refreshToken(refreshTokenDto);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('logout', () => {
    const mockRequest = {
      user: {
        id: '1',
        email: 'test@example.com',
      },
    } as unknown as RequestWithUser;

    const mockBody = {
      refreshToken: 'mockRefreshToken',
    };

    const mockResponse = {
      message: 'Logout realizado com sucesso',
    };

    it('should call authService.logout with correct parameters', async () => {
      jest.spyOn(authService, 'logout').mockResolvedValue(mockResponse);

      await controller.logout(mockRequest, mockBody);

      expect(authService.logout).toHaveBeenCalledWith(
        mockRequest.user.id,
        mockBody.refreshToken,
      );
    });

    it('should return the response from authService.logout', async () => {
      jest.spyOn(authService, 'logout').mockResolvedValue(mockResponse);

      const result = await controller.logout(mockRequest, mockBody);

      expect(result).toEqual(mockResponse);
    });
  });
}); 