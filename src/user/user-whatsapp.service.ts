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
    phoneNumberId: string;
    wabaId: string;
    accessToken: string;
  }): Promise<UserWhatsapp> {
    const encryptedToken = this.encryptionService.encrypt(data.accessToken);

    return this.prisma.userWhatsapp.upsert({
      where: {
        userId_businessId: {
          userId: data.userId,
          businessId: data.businessId,
        },
      },
      update: {
        phoneNumberId: data.phoneNumberId,
        wabaId: data.wabaId,
        accessToken: encryptedToken,
      },
      create: {
        userId: data.userId,
        businessId: data.businessId,
        phoneNumberId: data.phoneNumberId,
        wabaId: data.wabaId,
        accessToken: encryptedToken,
      },
    });
  }

  async getDecryptedToken(userId: number, businessId: string): Promise<string | null> {
    const record = await this.prisma.userWhatsapp.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
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
