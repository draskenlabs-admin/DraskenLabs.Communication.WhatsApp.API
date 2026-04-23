import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EncryptionService } from 'src/common/services/crypto.service';
import axios from 'axios';
import { WabaPhoneNumber } from '@prisma/client';

@Injectable()
export class WabaPhoneNumberService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async findAllByWabaId(userId: number, wabaId: string): Promise<WabaPhoneNumber[]> {
    // Ensure WABA belongs to user
    const waba = await this.prisma.waba.findFirst({
      where: { userId, wabaId },
    });
    if (!waba) throw new NotFoundException('WABA not found');

    return this.prisma.wabaPhoneNumber.findMany({
      where: { wabaId },
    });
  }

  async syncPhoneNumbers(userId: number, wabaId: string): Promise<WabaPhoneNumber[]> {
    // 1. Get access token for this WABA
    const userWhatsapp = await this.prisma.userWhatsapp.findFirst({
      where: { userId, wabaId },
    });
    if (!userWhatsapp) throw new NotFoundException('No connection found for this WABA');

    const accessToken = this.encryptionService.decrypt(userWhatsapp.accessToken);

    // 2. Fetch phone numbers from Meta Graph API
    const response = await axios.get(`https://graph.facebook.com/v25.0/${wabaId}/phone_numbers`, {
      params: {
        fields: 'id,verified_name,code_verification_status,display_phone_number,quality_rating,platform_type,throughput,last_onboarded_time',
      },
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const metaPhoneNumbers = response.data.data;
    const syncedPhoneNumbers: WabaPhoneNumber[] = [];

    // 3. Upsert into database
    for (const meta of metaPhoneNumbers) {
      const record = await this.prisma.wabaPhoneNumber.upsert({
        where: { phoneNumberId: meta.id },
        update: {
          verifiedName: meta.verified_name,
          codeVerificationStatus: meta.code_verification_status,
          displayPhoneNumber: meta.display_phone_number,
          qualityRating: meta.quality_rating,
          platformType: meta.platform_type,
          throughputLevel: meta.throughput?.level || 'NOT_APPLICABLE',
          lastOnboardedTime: new Date(meta.last_onboarded_time),
        },
        create: {
          phoneNumberId: meta.id,
          wabaId: wabaId,
          verifiedName: meta.verified_name,
          codeVerificationStatus: meta.code_verification_status,
          displayPhoneNumber: meta.display_phone_number,
          qualityRating: meta.quality_rating,
          platformType: meta.platform_type,
          throughputLevel: meta.throughput?.level || 'NOT_APPLICABLE',
          lastOnboardedTime: new Date(meta.last_onboarded_time),
        },
      });
      syncedPhoneNumbers.push(record);
    }

    return syncedPhoneNumbers;
  }
}
