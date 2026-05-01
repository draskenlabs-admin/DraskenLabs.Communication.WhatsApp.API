import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhookSignatureMiddleware } from './middleware/webhook-signature.middleware';
import { InboundMessageHandler } from './handlers/inbound-message.handler';
import { StatusUpdateHandler } from './handlers/status-update.handler';
import { AccountHandler } from './handlers/account.handler';
import { TemplateStatusHandler } from './handlers/template-status.handler';

@Module({
  controllers: [WebhooksController],
  providers: [
    WebhooksService,
    WebhookSignatureMiddleware,
    InboundMessageHandler,
    StatusUpdateHandler,
    AccountHandler,
    TemplateStatusHandler,
  ],
})
export class WebhooksModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(WebhookSignatureMiddleware)
      .forRoutes({ path: 'webhooks', method: RequestMethod.POST });
  }
}
