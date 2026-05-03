import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BaseResponseInterceptor } from './common/interceptors/base-response.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { BaseResponse } from './common/responses/base-response';
import { FieldErrorResponse } from './common/responses/field-error.util';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Preserve raw body bytes for webhook HMAC signature validation
  app.use(
    json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(cookieParser());
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidUnknownValues: true,
      exceptionFactory: (validationErrors: any[]) => {
        const errors: FieldErrorResponse[] = [];

        const collect = (errs: any[], parent?: string) => {
          for (const err of errs) {
            const field = parent ? `${parent}.${err.property}` : err.property;
            if (err.constraints && Object.values(err.constraints).length > 0) {
              const firstMsg = Object.values(err.constraints)[0] as string;
              errors.push({ field, message: firstMsg });
            } else if (err.children && err.children.length > 0) {
              collect(err.children, field);
            }
          }
        };
        collect(validationErrors);

        return BaseResponse.fieldError(422, errors);
      },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new BaseResponseInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('DraskenLabs WhatsApp Communication API')
    .setDescription(
      'NestJS backend for DraskenLabs WhatsApp Communication API using PostgreSQL, Prisma, and Redis.',
    )
    .addBearerAuth()
    .setVersion('1.0.0')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger/docs', app, swaggerDocument);
  app
    .getHttpAdapter()
    .getInstance()
    .get('/swagger/json', (_req, res) => res.json(swaggerDocument));

  const shutdown = async (signal: NodeJS.Signals) => {
    await app.close();
    process.exit(signal === 'SIGINT' ? 130 : 0);
  };

  for (const signal of ['SIGINT', 'SIGTERM', 'SIGQUIT'] as const) {
    process.once(signal, () => {
      void shutdown(signal);
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
