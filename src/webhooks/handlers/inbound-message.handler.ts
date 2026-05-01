import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class InboundMessageHandler {
  private readonly logger = new Logger(InboundMessageHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(
    wabaId: string,
    phoneNumberId: string,
    message: any,
    senderName: string | undefined,
  ): Promise<void> {
    const timestamp = new Date(Number(message.timestamp) * 1000);
    const type: string = message.type;
    const payload = message[type] ?? message;

    try {
      await this.prisma.inboundMessage.upsert({
        where: { metaMessageId: message.id },
        create: {
          metaMessageId: message.id,
          wabaId,
          phoneNumberId,
          from: message.from,
          senderName: senderName ?? null,
          type,
          payload,
          timestamp,
        },
        update: {},
      });
    } catch (err: any) {
      this.logger.error(`Failed to persist inbound message ${message.id}: ${err.message}`);
    }
  }
}
