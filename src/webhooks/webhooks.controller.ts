import { Controller, Get, Post, Query, Res, Body, ForbiddenException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { WebhooksService } from './webhooks.service';

@ApiExcludeController()
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly config: ConfigService,
  ) {}

  @Get()
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
  receive(@Body() body: any, @Res() res: Response): void {
    res.status(200).send('EVENT_RECEIVED');

    setImmediate(() => {
      this.webhooksService.processPayload(body).catch(() => {});
    });
  }
}
