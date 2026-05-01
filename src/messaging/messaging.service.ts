import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { EncryptionService } from 'src/common/services/crypto.service';
import { ContactsService } from 'src/contacts/contacts.service';
import { SendMessageDto, MessageTypeEnum } from './dto/send-message.dto';
import { SendMessageResponseDto, MessageListItemDto } from './dto/message-response.dto';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);
  private readonly metaApiVersion = 'v21.0';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly encryptionService: EncryptionService,
    private readonly contactsService: ContactsService,
  ) {}

  async sendMessage(userId: number, orgId: number, dto: SendMessageDto): Promise<SendMessageResponseDto> {
    const phoneCache = await this.redisService.getPhoneCache(dto.phoneNumberId);

    if (!phoneCache) {
      throw new NotFoundException(
        `Phone number ${dto.phoneNumberId} not found. Run a phone sync first.`,
      );
    }

    if (phoneCache.userId !== userId) {
      throw new ForbiddenException('Phone number does not belong to your account');
    }

    const optedOut = await this.contactsService.isOptedOut(orgId, dto.to);
    if (optedOut) throw new BadRequestException(`Recipient ${dto.to} has opted out of messages`);

    const plainToken = this.encryptionService.decrypt(phoneCache.accessToken);
    const metaPayload = this.buildMetaPayload(dto);

    const metaResponse = await axios.post(
      `https://graph.facebook.com/${this.metaApiVersion}/${dto.phoneNumberId}/messages`,
      metaPayload,
      {
        headers: {
          Authorization: `Bearer ${plainToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const metaMessageId: string | undefined = metaResponse.data?.messages?.[0]?.id;

    const message = await this.prisma.message.create({
      data: {
        metaMessageId,
        phoneNumberId: dto.phoneNumberId,
        to: dto.to,
        type: dto.type,
        payload: metaPayload as object,
        status: 'sent',
        userId,
        orgId,
      },
    });

    return {
      id: message.id,
      metaMessageId: message.metaMessageId ?? undefined,
      phoneNumberId: message.phoneNumberId,
      to: message.to,
      type: message.type,
      status: message.status,
      createdAt: message.createdAt,
    };
  }

  async findAll(orgId: number): Promise<MessageListItemDto[]> {
    const messages = await this.prisma.message.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });

    return messages.map((m) => ({
      id: m.id,
      metaMessageId: m.metaMessageId ?? undefined,
      phoneNumberId: m.phoneNumberId,
      to: m.to,
      type: m.type,
      status: m.status,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  }

  async findOne(orgId: number, messageId: number): Promise<MessageListItemDto> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.orgId !== orgId) {
      throw new NotFoundException('Message not found');
    }

    return {
      id: message.id,
      metaMessageId: message.metaMessageId ?? undefined,
      phoneNumberId: message.phoneNumberId,
      to: message.to,
      type: message.type,
      status: message.status,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }

  private buildMetaPayload(dto: SendMessageDto): Record<string, unknown> {
    const base: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: dto.to,
      type: dto.type,
    };

    switch (dto.type) {
      case MessageTypeEnum.text:
        base.text = { body: dto.text };
        break;
      case MessageTypeEnum.image:
        base.image = dto.caption
          ? { link: dto.mediaUrl, caption: dto.caption }
          : { link: dto.mediaUrl };
        break;
      case MessageTypeEnum.video:
        base.video = dto.caption
          ? { link: dto.mediaUrl, caption: dto.caption }
          : { link: dto.mediaUrl };
        break;
      case MessageTypeEnum.audio:
        base.audio = { link: dto.mediaUrl };
        break;
      case MessageTypeEnum.document:
        base.document = dto.caption
          ? { link: dto.mediaUrl, caption: dto.caption }
          : { link: dto.mediaUrl };
        break;
      case MessageTypeEnum.template:
        base.template = {
          name: dto.templateName,
          language: { code: dto.templateLanguage },
          ...(dto.templateComponents?.length ? { components: dto.templateComponents } : {}),
        };
        break;
      default:
        break;
    }

    return base;
  }
}
