import { Controller, UseGuards, Get,Request, ForbiddenException} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { RoleService } from '../../auth/role.service';
import { UploadService } from './../upload/upload.service';
@Controller('api/users')
export class UsersController {
    constructor(
        private usersService: UsersService,
        private roleService: RoleService,
        private uploadService : UploadService
    ) {}


    @Get()
    @UseGuards(JwtAuthGuard)
    async getAllUsers( @Request() req: { user: { id: string } }) {

        if (!(await this.roleService.isAdmin(req.user.id))) 
            throw new ForbiddenException('You do not have permission to access this resource');

        const usersFromDb = await this.usersService.listAllUsers();

        const userPromises = usersFromDb.map(async (user) => {
            const roleName = await this.roleService.roleIdToString(user.roleId);
            const files = await this.uploadService.getUserFiles(user.id);
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
                role: roleName,
                files:files
            };
        });
        const usersWithRoles = await Promise.all(userPromises);

        return usersWithRoles;
    }
}