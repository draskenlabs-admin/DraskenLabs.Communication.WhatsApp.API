import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from 'src/redis/redis.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EncryptionService } from 'src/common/services/crypto.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class ApiKeyAuthMiddleware implements NestMiddleware {
  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly userService: UserService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const accessKey = req.headers['x-access-key'] as string;
    const secretKey = req.headers['x-secret-key'] as string;

    if (!accessKey || !secretKey) {
      throw new UnauthorizedException('API key headers missing');
    }

    let cachedKey = await this.redisService.getApiKeyCache(accessKey);

    if (!cachedKey) {
      const dbKey = await this.prisma.userApiKey.findUnique({
        where: { accessKey },
      });

      if (!dbKey || !dbKey.status) {
        throw new UnauthorizedException('Invalid API key');
      }

      await this.redisService.setApiKeyCache(accessKey, dbKey.userId, dbKey.secretKey);
      cachedKey = { userId: dbKey.userId, secretKey: dbKey.secretKey };
    }

    let decryptedSecret: string;
    try {
      decryptedSecret = this.encryptionService.decrypt(cachedKey.secretKey);
    } catch {
      throw new UnauthorizedException('Invalid API key');
    }

    if (decryptedSecret !== secretKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    let user = await this.redisService.getUserCache(cachedKey.userId);

    if (!user) {
      const dbUser = await this.userService.findById(cachedKey.userId);
      if (!dbUser) throw new UnauthorizedException('User not found');

      user = {
        id: dbUser.id,
        clerkId: dbUser.clerkId,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        status: dbUser.status,
      };
      await this.redisService.setUserCache(cachedKey.userId, user);
    }

    if (!user.status) {
      throw new UnauthorizedException('Account is deactivated');
    }

    (req as any).user = user;
    (req as any).authType = 'apiKey';
    next();
  }
}
