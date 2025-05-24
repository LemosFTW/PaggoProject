import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleService } from 'src/modules/auth/role.service';
import { UploadModule } from '../upload/upload.module';

@Module({
    imports: [UploadModule],
    controllers: [
        UsersController
    ],
    providers: [
        UsersService,
        PrismaService,
        RoleService
    ],
    exports: [],
})
export class UsersModule {}