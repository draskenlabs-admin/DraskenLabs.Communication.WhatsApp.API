import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { ApiKeyModule } from 'src/api-key/api-key.module';
import { ApiKeyAuthMiddleware } from 'src/api-key/middleware/api-key-auth.middleware';
import { UserModule } from 'src/user/user.module';
import { ContactsModule } from 'src/contacts/contacts.module';

@Module({
  imports: [ApiKeyModule, UserModule, ContactsModule],
  providers: [MessagingService],
  controllers: [MessagingController],
})
export class MessagingModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiKeyAuthMiddleware)
      .forRoutes(
        { path: 'messages', method: RequestMethod.POST },
        { path: 'messages', method: RequestMethod.GET },
        { path: 'messages/:id', method: RequestMethod.GET },
      );
  }
}
