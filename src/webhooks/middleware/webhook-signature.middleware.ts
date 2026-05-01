import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class WebhookSignatureMiddleware implements NestMiddleware {
  constructor(private readonly config: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    if (!signature) throw new UnauthorizedException('Missing X-Hub-Signature-256');

    const appSecret = this.config.get<string>('META_APP_SECRET');
    if (!appSecret) throw new UnauthorizedException('Webhook app secret not configured');

    const rawBody: Buffer = (req as any).rawBody;
    if (!rawBody) throw new UnauthorizedException('Raw body not available');

    const expected = createHmac('sha256', appSecret).update(rawBody).digest('hex');
    const received = signature.replace('sha256=', '');

    const expectedBuf = Buffer.from(expected, 'hex');
    const receivedBuf = Buffer.from(received, 'hex');

    if (expectedBuf.length !== receivedBuf.length || !timingSafeEqual(expectedBuf, receivedBuf)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    next();
  }
}
