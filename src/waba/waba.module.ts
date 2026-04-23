import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { WabaService } from './waba.service';
import { WabaController } from './waba.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserModule } from 'src/user/user.module';
import { AuthMiddleware } from 'src/user/middleware/auth.middleware';

@Module({
  imports: [PrismaModule, UserModule],
  providers: [WabaService],
  controllers: [WabaController],
  exports: [WabaService],
})
export class WabaModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(WabaController);
  }
}
