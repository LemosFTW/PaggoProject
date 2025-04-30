import { Controller, UseGuards, UseInterceptors, UploadedFile, Request, Get, Delete, Param, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
@Controller('api/users')
export class UsersController {
    constructor(
        private usersService: UsersService,
    ) {}


    @Get()
    @UseGuards(JwtAuthGuard)
    async getAllUsers() {
        return (await this.usersService.listAllUsers()).map(user => {
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt
                }
            }
        )
    }
}