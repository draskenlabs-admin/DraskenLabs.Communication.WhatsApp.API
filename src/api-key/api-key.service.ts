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

  async createApiKey(userId: number, orgId: number, dto: CreateApiKeyDto): Promise<ApiKeyResponseDto> {
    const accessKey = `ak_${crypto.randomBytes(12).toString('hex')}`;
    const secretKey = `sk_${crypto.randomBytes(24).toString('hex')}`;
    const encryptedSecretKey = this.encryptionService.encrypt(secretKey);

    await this.prisma.userApiKey.create({
      data: { userId, orgId, accessKey, secretKey: encryptedSecretKey },
    });

    await this.redisService.setApiKeyCache(accessKey, userId, orgId, encryptedSecretKey);

    return { accessKey, secretKey };
  }

  async findAllByOrgId(orgId: number) {
    return this.prisma.userApiKey.findMany({
      where: { orgId },
      select: { id: true, accessKey: true, status: true, createdAt: true },
    });
  }

  async revokeApiKey(userId: number, keyId: number): Promise<void> {
    const key = await this.prisma.userApiKey.findUnique({ where: { id: keyId } });

    if (!key || key.userId !== userId) {
      throw new NotFoundException('API key not found');
    }

    await this.prisma.userApiKey.update({
      where: { id: keyId },
      data: { status: false },
    });

    await this.redisService.deleteApiKeyCache(key.accessKey);
  }
}
