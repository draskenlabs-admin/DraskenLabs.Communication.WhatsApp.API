import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findBySsoId(ssoId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { ssoId } });
  }

  async findOrCreateBySsoId(ssoId: string): Promise<User> {
    const existing = await this.prisma.user.findUnique({ where: { ssoId } });
    if (existing) return existing;
    return this.prisma.user.create({ data: { ssoId } });
  }
}
