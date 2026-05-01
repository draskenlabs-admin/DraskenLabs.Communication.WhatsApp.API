import { Controller, Get, Post, Query, Res, Body, ForbiddenException } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Meta webhook verification',
    description:
      'One-time GET request sent by Meta when a webhook subscription is created. Validates hub.verify_token and echoes hub.challenge as plain text.',
  })
  @ApiQuery({ name: 'hub.mode', required: true, example: 'subscribe' })
  @ApiQuery({ name: 'hub.verify_token', required: true, description: 'Must match WEBHOOK_VERIFY_TOKEN env var' })
  @ApiQuery({ name: 'hub.challenge', required: true, description: 'Random integer echoed back on success' })
  @ApiResponse({ status: 200, description: 'Challenge echoed — subscription confirmed' })
  @ApiResponse({ status: 403, description: 'Token mismatch or mode not subscribe' })
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ): void {
    const verifyToken = this.config.get<string>('WEBHOOK_VERIFY_TOKEN');

    if (mode !== 'subscribe' || token !== verifyToken) {
      throw new ForbiddenException('Webhook verification failed');
    }

    res.status(200).send(challenge);
  }

  @Post()
  @ApiOperation({
    summary: 'Receive Meta webhook events',
    description:
      'Receives all lifecycle events from Meta (inbound messages, delivery/read status, template updates, account events). ' +
      'Requires a valid X-Hub-Signature-256 HMAC header. Always returns 200 immediately; processing is asynchronous.',
  })
  @ApiResponse({ status: 200, description: 'Event accepted for processing' })
  @ApiResponse({ status: 401, description: 'Missing or invalid X-Hub-Signature-256 header' })
  receive(@Body() body: any, @Res() res: Response): void {
    res.status(200).send('EVENT_RECEIVED');

    setImmediate(() => {
      this.webhooksService.processPayload(body).catch(() => {});
    });
  }
}
