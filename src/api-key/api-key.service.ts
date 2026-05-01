import { Injectable } from '@nestjs/common';
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
    // Generate access key (public) and secret key (shown once)
    const accessKey = `ak_${crypto.randomBytes(12).toString('hex')}`;
    const secretKey = `sk_${crypto.randomBytes(24).toString('hex')}`;
    const encryptedSecretKey = this.encryptionService.encrypt(secretKey);

    // Persist to DB
    await this.prisma.userApiKey.create({
      data: { userId, accessKey, secretKey: encryptedSecretKey },
    });

    // Cache in Redis — user-scoped, no phone binding at creation time
    await this.redisService.setApiKeyCache(accessKey, userId, encryptedSecretKey);

    return { accessKey, secretKey };
  }

  async findAllByUserId(userId: number) {
    return this.prisma.userApiKey.findMany({
      where: { userId },
      select: { id: true, accessKey: true, status: true, createdAt: true },
    });
  }
}
