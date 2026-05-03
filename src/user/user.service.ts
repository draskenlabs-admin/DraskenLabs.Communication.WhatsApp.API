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

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findOrCreateBySsoId(data: {
    ssoId: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    const existing = await this.prisma.user.findUnique({ where: { ssoId: data.ssoId } });
    if (existing) return existing;

    return this.prisma.user.create({ data });
  }
}
