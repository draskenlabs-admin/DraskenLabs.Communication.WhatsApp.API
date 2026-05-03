import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EncryptionService } from 'src/common/services/crypto.service';
import { RedisService } from 'src/redis/redis.service';
import axios from 'axios';
import { Waba } from '@prisma/client';

@Injectable()
export class WabaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly redisService: RedisService,
  ) {}

  async findAllByOrgId(orgId: number): Promise<Waba[]> {
    return this.prisma.waba.findMany({ where: { orgId } });
  }

  async findByWabaId(orgId: number, wabaId: string): Promise<Waba> {
    const waba = await this.prisma.waba.findFirst({ where: { orgId, wabaId } });
    if (!waba) throw new NotFoundException('WABA not found');
    return waba;
  }

  async getWabaDetailsFromMeta(userId: number, wabaId: string): Promise<any> {
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
    orgId: number;
    name?: string;
    currency?: string;
    timezoneId?: string;
    messageTemplateNamespace?: string;
  }): Promise<Waba> {
    const existing = await this.prisma.waba.findUnique({ where: { wabaId: data.wabaId } });
    if (existing && existing.userId !== data.userId) {
      throw new ForbiddenException('WABA belongs to another account');
    }

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
        orgId: data.orgId,
        name: data.name,
        currency: data.currency,
        timezoneId: data.timezoneId,
        messageTemplateNamespace: data.messageTemplateNamespace,
      },
    });
  }

  async disconnectWaba(userId: number, orgId: number, wabaId: string): Promise<void> {
    const waba = await this.prisma.waba.findFirst({ where: { wabaId, orgId } });
    if (!waba) throw new NotFoundException('WABA not found in your organisation');

    const userWhatsapp = await this.prisma.userWhatsapp.findUnique({
      where: { userId_wabaId: { userId, wabaId } },
    });
    if (!userWhatsapp) throw new ForbiddenException('You are not the owner of this WABA connection');

    // Invalidate Redis phone cache for all phone numbers on this WABA
    const phoneNumbers = await this.prisma.wabaPhoneNumber.findMany({
      where: { wabaId },
      select: { phoneNumberId: true },
    });
    await Promise.all(phoneNumbers.map((p) => this.redisService.invalidatePhoneCache(p.phoneNumberId)));

    // Remove the connection (access token) — Waba and WabaPhoneNumber records are preserved for audit
    await this.prisma.userWhatsapp.delete({
      where: { userId_wabaId: { userId, wabaId } },
    });
  }
}
