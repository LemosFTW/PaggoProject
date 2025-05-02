import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
  
  @Injectable()
  export class RoleService {
    constructor(
      private prisma: PrismaService,
    ) {}

    async getAllRoles() {
      return this.prisma.roles.findMany();
    }

    async isAdmin(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
            role: true,
            },
        });
    
        if (!user) 
            throw new Error('User not found or no role assigned');
        return user.role?.name === 'Admin';
        }

    async roleIdToString(roleId: number | null): Promise<string> {
        if (roleId === null) {
            return Promise.resolve('No role setted');
        }

        const role = await this.prisma.roles.findUnique({
            where: { id: roleId },
        });
    
        if (!role) {
            throw new Error(`Role with ID ${roleId} not found`);
        }
    
        return role.name;
    }
}