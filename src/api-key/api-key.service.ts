import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EncryptionService } from 'src/common/services/crypto.service';
import { RedisService } from 'src/redis/redis.service';
import * as crypto from 'crypto';
import { CreateApiKeyDto, ApiKeyResponseDto } from './dto/api-key.dto';

@Injectable()
export class ApiKeyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly redisService: RedisService,
  ) {}

  async createApiKey(userId: number, dto: CreateApiKeyDto): Promise<ApiKeyResponseDto> {
    // 1. Fetch user whatsapp record to get the accessToken
    const userWhatsapp = await this.prisma.userWhatsapp.findFirst({
      where: {
        userId,
        phoneNumberId: dto.phoneNumberId,
        wabaId: dto.wabaId,
      },
    });

    if (!userWhatsapp) {
      throw new NotFoundException('WhatsApp connection not found for this user and phone number');
    }

    // Decrypt the stored accessToken
    const decryptedAccessToken = this.encryptionService.decrypt(userWhatsapp.accessToken);

    // 2. Generate random access key and secret key
    const accessKey = `ak_${crypto.randomBytes(12).toString('hex')}`;
    const secretKey = `sk_${crypto.randomBytes(24).toString('hex')}`;

    // 3. Encrypt secret key for database storage
    const encryptedSecretKey = this.encryptionService.encrypt(secretKey);

    // 4. Save to database
    await this.prisma.userApiKey.create({
      data: {
        userId,
        accessKey,
        secretKey: encryptedSecretKey,
      },
    });

    // 5. Store in Redis
    // access_key:<access_key> -> hset { secret_key: <secret_key>, <phone_number_id>: <accessToken> }
    await this.redisService.setApiKey(
      accessKey,
      secretKey,
      dto.phoneNumberId,
      decryptedAccessToken,
    );

    return {
      accessKey,
      secretKey,
    };
  }

  async findAllByUserId(userId: number) {
    return this.prisma.userApiKey.findMany({
      where: { userId },
      select: {
        id: true,
        accessKey: true,
        status: true,
        createdAt: true,
      },
    });
  }
}
