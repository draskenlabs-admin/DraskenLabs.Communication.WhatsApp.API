import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EncryptionService } from 'src/common/services/crypto.service';
import axios from 'axios';
import { Waba } from '@prisma/client';

@Injectable()
export class WabaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async findAllByUserId(userId: number): Promise<Waba[]> {
    return this.prisma.waba.findMany({
      where: { userId },
    });
  }

  async findByWabaId(userId: number, wabaId: string): Promise<Waba> {
    const waba = await this.prisma.waba.findFirst({
      where: { userId, wabaId },
    });
    if (!waba) throw new NotFoundException('WABA not found');
    return waba;
  }

  async getWabaDetailsFromMeta(userId: number, wabaId: string): Promise<any> {
    // To get details from Meta, we need an access token associated with this WABA
    const userWhatsapp = await this.prisma.userWhatsapp.findFirst({
      where: { userId, wabaId },
    });

    if (!userWhatsapp) {
      throw new NotFoundException('No connection found for this WABA');
    }

    const accessToken = this.encryptionService.decrypt(
      userWhatsapp.accessToken,
    );

    const response = await axios.get(
      `https://graph.facebook.com/v25.0/${wabaId}`,
      {
        params: {
          fields: 'id,name,currency,timezone_id,message_template_namespace,tasks',
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    return response.data;
  }

  async createOrUpdateWaba(data: {
    wabaId: string;
    userId: number;
    name?: string;
    currency?: string;
    timezoneId?: string;
    messageTemplateNamespace?: string;
  }): Promise<Waba> {
    return this.prisma.waba.upsert({
      where: { wabaId: data.wabaId },
      update: {
        name: data.name,
        currency: data.currency,
        timezoneId: data.timezoneId,
        messageTemplateNamespace: data.messageTemplateNamespace,
      },
      create: {
        wabaId: data.wabaId,
        userId: data.userId,
        name: data.name,
        currency: data.currency,
        timezoneId: data.timezoneId,
        messageTemplateNamespace: data.messageTemplateNamespace,
      },
    });
  }
}
