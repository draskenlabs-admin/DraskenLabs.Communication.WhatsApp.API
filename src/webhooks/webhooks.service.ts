import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { InboundMessageHandler } from './handlers/inbound-message.handler';
import { StatusUpdateHandler } from './handlers/status-update.handler';
import { AccountHandler } from './handlers/account.handler';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly inboundHandler: InboundMessageHandler,
    private readonly statusHandler: StatusUpdateHandler,
    private readonly accountHandler: AccountHandler,
  ) {}

  async processPayload(body: any): Promise<void> {
    if (body.object !== 'whatsapp_business_account') return;

    for (const entry of body.entry ?? []) {
      const wabaId: string = entry.id;

      for (const change of entry.changes ?? []) {
        const { field, value } = change;

        const event = await this.prisma.webhookEvent.create({
          data: { eventType: field, wabaId, payload: value, processed: false },
        });

        try {
          await this.routeChange(field, wabaId, value);
          await this.prisma.webhookEvent.update({
            where: { id: event.id },
            data: { processed: true },
          });
        } catch (err: any) {
          this.logger.error(`Error processing webhook event ${event.id}: ${err.message}`);
          await this.prisma.webhookEvent.update({
            where: { id: event.id },
            data: { error: err.message },
          });
        }
      }
    }
  }

  private async routeChange(field: string, wabaId: string, value: any): Promise<void> {
    switch (field) {
      case 'messages':
        await this.handleMessagesField(wabaId, value);
        break;
      case 'account_update':
        await this.accountHandler.handleAccountUpdate(value);
        break;
      case 'phone_number_quality_update':
        await this.accountHandler.handlePhoneQualityUpdate(value);
        break;
      case 'phone_number_name_update':
        await this.accountHandler.handlePhoneNameUpdate(value);
        break;
      default:
        this.logger.log(`Unhandled webhook field: ${field}`);
    }
  }

  private async handleMessagesField(wabaId: string, value: any): Promise<void> {
    const phoneNumberId: string = value.metadata?.phone_number_id ?? '';
    const senderName: string | undefined = value.contacts?.[0]?.profile?.name;

    for (const message of value.messages ?? []) {
      await this.inboundHandler.handle(wabaId, phoneNumberId, message, senderName);
    }

    for (const status of value.statuses ?? []) {
      await this.statusHandler.handle(status);
    }

    for (const error of value.errors ?? []) {
      this.logger.error(`Webhook error from Meta: code=${error.code} title=${error.title}`);
    }
  }
}
