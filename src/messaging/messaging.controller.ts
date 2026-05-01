import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { MessagingService } from './messaging.service';
import { SendMessageDto } from './dto/send-message.dto';
import { SendMessageResponseDto, MessageListItemDto } from './dto/message-response.dto';
import { ApiWrappedOkResponse } from 'src/common/responses/swagger.decorators';

@ApiTags('Messaging')
@ApiSecurity('x-access-key')
@ApiSecurity('x-secret-key')
@Controller('messages')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post()
  @ApiOperation({ summary: 'Send a WhatsApp message' })
  @ApiWrappedOkResponse({ dataDto: SendMessageResponseDto, description: 'Message sent' })
  async send(@Req() req: Request, @Body() dto: SendMessageDto): Promise<SendMessageResponseDto> {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException('User not found in context');
    return this.messagingService.sendMessage(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all messages for current user' })
  @ApiWrappedOkResponse({ dataDto: MessageListItemDto, isArray: true, description: 'Message list' })
  async findAll(@Req() req: Request): Promise<MessageListItemDto[]> {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException('User not found in context');
    return this.messagingService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single message by ID' })
  @ApiWrappedOkResponse({ dataDto: MessageListItemDto, description: 'Message detail' })
  async findOne(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<MessageListItemDto> {
    const user = (req as any).user;
    if (!user) throw new UnauthorizedException('User not found in context');
    return this.messagingService.findOne(user.id, id);
  }
}
