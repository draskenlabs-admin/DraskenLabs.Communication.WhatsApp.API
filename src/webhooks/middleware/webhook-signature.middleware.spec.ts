import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { WebhookSignatureMiddleware } from './webhook-signature.middleware';
import { ConfigService } from '@nestjs/config';

const APP_SECRET = 'test_app_secret';
const mockConfigService = { get: jest.fn().mockReturnValue(APP_SECRET) };

describe('WebhookSignatureMiddleware', () => {
  let middleware: WebhookSignatureMiddleware;
  let next: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    next = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookSignatureMiddleware,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();
    middleware = module.get<WebhookSignatureMiddleware>(WebhookSignatureMiddleware);
  });

  const makeReq = (overrides: any = {}) => ({
    headers: {},
    rawBody: Buffer.from('{"entry":[]}'),
    ...overrides,
  } as any);

  const sign = (body: Buffer) =>
    'sha256=' + createHmac('sha256', APP_SECRET).update(body).digest('hex');

  it('throws when X-Hub-Signature-256 header is missing', () => {
    expect(() => middleware.use(makeReq(), {} as any, next)).toThrow(UnauthorizedException);
  });

  it('throws when app secret is not configured', () => {
    mockConfigService.get.mockReturnValueOnce(undefined);
    const req = makeReq({ headers: { 'x-hub-signature-256': 'sha256=abc' } });
    expect(() => middleware.use(req, {} as any, next)).toThrow(UnauthorizedException);
  });

  it('throws when rawBody is missing', () => {
    const req = makeReq({ headers: { 'x-hub-signature-256': 'sha256=abc' }, rawBody: undefined });
    expect(() => middleware.use(req, {} as any, next)).toThrow(UnauthorizedException);
  });

  it('throws when signature does not match', () => {
    const body = Buffer.from('{"entry":[]}');
    const req = makeReq({
      headers: { 'x-hub-signature-256': 'sha256=badsignature' },
      rawBody: body,
    });
    expect(() => middleware.use(req, {} as any, next)).toThrow(UnauthorizedException);
  });

  it('calls next() when signature is valid', () => {
    const body = Buffer.from('{"entry":[]}');
    const req = makeReq({
      headers: { 'x-hub-signature-256': sign(body) },
      rawBody: body,
    });
    middleware.use(req, {} as any, next);
    expect(next).toHaveBeenCalled();
  });
});
