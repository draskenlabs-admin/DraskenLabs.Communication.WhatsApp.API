import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConnectController } from './connect.controller';
import { ConnectService } from './connect.service';
import { UserModule } from 'src/user/user.module';
import { RedisModule } from 'src/redis/redis.module';
import { WabaModule } from 'src/waba/waba.module';
import { AuthMiddleware } from 'src/user/middleware/auth.middleware';

@Module({
  imports: [UserModule, RedisModule, WabaModule],
  controllers: [ConnectController],
  providers: [ConnectService],
})
export class ConnectModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'connect', method: RequestMethod.POST },
        { path: 'connect/businesses', method: RequestMethod.GET },
        { path: 'connect/:businessId/ownedWABAs', method: RequestMethod.GET }
      );
  }
}
