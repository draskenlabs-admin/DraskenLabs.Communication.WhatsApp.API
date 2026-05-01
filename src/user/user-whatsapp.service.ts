import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EncryptionService } from 'src/common/services/crypto.service';
import { UserWhatsapp } from '@prisma/client';

@Injectable()
export class UserWhatsappService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async createOrUpdate(data: {
    userId: number;
    businessId: string;
    wabaId: string;
    accessToken: string;
  }): Promise<UserWhatsapp> {
    const encryptedToken = this.encryptionService.encrypt(data.accessToken);

    return this.prisma.userWhatsapp.upsert({
      where: {
        userId_wabaId: {
          userId: data.userId,
          wabaId: data.wabaId,
        },
      },
      update: {
        businessId: data.businessId,
        accessToken: encryptedToken,
      },
      create: {
        userId: data.userId,
        businessId: data.businessId,
        wabaId: data.wabaId,
        accessToken: encryptedToken,
      },
    });
  }

  async getEncryptedToken(userId: number, wabaId: string): Promise<string | null> {
    const record = await this.prisma.userWhatsapp.findUnique({
      where: { userId_wabaId: { userId, wabaId } },
    });
    return record?.accessToken ?? null;
  }

  async getDecryptedToken(userId: number, wabaId: string): Promise<string | null> {
    const record = await this.prisma.userWhatsapp.findUnique({
      where: { userId_wabaId: { userId, wabaId } },
    });
    if (!record) return null;
    return this.encryptionService.decrypt(record.accessToken);
  }

  async findAllByUserId(userId: number): Promise<UserWhatsapp[]> {
    return this.prisma.userWhatsapp.findMany({
      where: { userId },
    });
  }
}
