import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EncryptionService } from 'src/common/services/crypto.service';
import { RedisService } from 'src/redis/redis.service';
import axios from 'axios';
import { WabaPhoneNumber } from '@prisma/client';

@Injectable()
export class WabaPhoneNumberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly redisService: RedisService,
  ) {}

  async findAllByWabaId(userId: number, wabaId: string): Promise<WabaPhoneNumber[]> {
    const waba = await this.prisma.waba.findFirst({ where: { userId, wabaId } });
    if (!waba) throw new NotFoundException('WABA not found');
    return this.prisma.wabaPhoneNumber.findMany({ where: { wabaId } });
  }

  // Fetches phone numbers from Meta and upserts them into the DB.
  private async fetchAndUpsert(wabaId: string, rawAccessToken: string): Promise<WabaPhoneNumber[]> {
    const response = await axios.get(
      `https://graph.facebook.com/v25.0/${wabaId}/phone_numbers`,
      {
        params: {
          fields: 'id,verified_name,code_verification_status,display_phone_number,quality_rating,platform_type,throughput,last_onboarded_time',
        },
        headers: { Authorization: `Bearer ${rawAccessToken}` },
      },
    );

    const synced: WabaPhoneNumber[] = [];
    for (const meta of response.data.data) {
      const record = await this.prisma.wabaPhoneNumber.upsert({
        where: { phoneNumberId: meta.id },
        update: {
          verifiedName: meta.verified_name,
          codeVerificationStatus: meta.code_verification_status,
          displayPhoneNumber: meta.display_phone_number,
          qualityRating: meta.quality_rating,
          platformType: meta.platform_type,
          throughputLevel: meta.throughput?.level ?? 'NOT_APPLICABLE',
          lastOnboardedTime: new Date(meta.last_onboarded_time),
        },
        create: {
          phoneNumberId: meta.id,
          wabaId,
          verifiedName: meta.verified_name,
          codeVerificationStatus: meta.code_verification_status,
          displayPhoneNumber: meta.display_phone_number,
          qualityRating: meta.quality_rating,
          platformType: meta.platform_type,
          throughputLevel: meta.throughput?.level ?? 'NOT_APPLICABLE',
          lastOnboardedTime: new Date(meta.last_onboarded_time),
        },
      });
      synced.push(record);
    }
    return synced;
  }

  // Populates Redis phone cache for each synced phone number.
  private async populatePhoneCache(
    phones: WabaPhoneNumber[],
    userId: number,
    wabaId: string,
    encryptedToken: string,
  ): Promise<void> {
    for (const phone of phones) {
      await this.redisService.setPhoneCache(
        phone.phoneNumberId,
        userId,
        wabaId,
        encryptedToken,
      );
    }
  }

  // Called by the manual sync endpoint — looks up the stored token then syncs.
  async syncPhoneNumbers(userId: number, wabaId: string): Promise<WabaPhoneNumber[]> {
    const userWhatsapp = await this.prisma.userWhatsapp.findFirst({
      where: { userId, wabaId },
    });
    if (!userWhatsapp) throw new NotFoundException('No connection found for this WABA');

    const rawAccessToken = this.encryptionService.decrypt(userWhatsapp.accessToken);
    const phones = await this.fetchAndUpsert(wabaId, rawAccessToken);
    await this.populatePhoneCache(phones, userId, wabaId, userWhatsapp.accessToken);
    return phones;
  }

  // Called by the connect flow — caller already has both raw and encrypted token.
  async syncPhoneNumbersWithToken(
    userId: number,
    wabaId: string,
    rawAccessToken: string,
    encryptedToken: string,
  ): Promise<WabaPhoneNumber[]> {
    const phones = await this.fetchAndUpsert(wabaId, rawAccessToken);
    await this.populatePhoneCache(phones, userId, wabaId, encryptedToken);
    return phones;
  }
}
