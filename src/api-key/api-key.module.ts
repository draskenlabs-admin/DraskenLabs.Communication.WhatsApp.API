import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { ApiKeyController } from './api-key.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RedisModule } from 'src/redis/redis.module';
import { UserModule } from 'src/user/user.module';
import { AuthMiddleware } from 'src/user/middleware/auth.middleware';

@Module({
  imports: [PrismaModule, RedisModule, UserModule],
  providers: [ApiKeyService],
  controllers: [ApiKeyController],
})
export class ApiKeyModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(ApiKeyController);
  }
}
