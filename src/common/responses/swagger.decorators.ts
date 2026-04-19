import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiResponse,
  ApiUnprocessableEntityResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  BadRequestResponseDto,
  BaseSuccessResponseDto,
  ConflictResponseDto,
  ForbiddenResponseDto,
  NotFoundResponseDto,
  UnauthorizedResponseDto,
  ValidationErrorResponseDto,
} from './swagger-response.dto';

type WrappedResponseOptions = {
  dataDto: Type<unknown>;
  description?: string;
  metaDto?: Type<unknown>;
  isArray?: boolean;
};

function buildWrappedSchema(
  dataDto: Type<unknown>,
  metaDto?: Type<unknown>,
  isArray?: boolean,
) {
  return {
    allOf: [
      { $ref: getSchemaPath(BaseSuccessResponseDto) },
      {
        type: 'object',
        properties: {
          data: isArray
            ? { type: 'array', items: { $ref: getSchemaPath(dataDto) } }
            : { $ref: getSchemaPath(dataDto) },
          ...(metaDto ? { meta: { $ref: getSchemaPath(metaDto) } } : {}),
        },
        required: ['data', ...(metaDto ? ['meta'] : [])],
      },
    ],
  };
}

export function ApiWrappedOkResponse(options: WrappedResponseOptions) {
  return applyDecorators(
    ApiExtraModels(
      BaseSuccessResponseDto,
      options.dataDto,
      ...(options.metaDto ? [options.metaDto] : []),
    ),
    ApiResponse({
      status: 200,
      description: options.description,
      schema: buildWrappedSchema(options.dataDto, options.metaDto, options.isArray),
    }),
  );
}

export function ApiWrappedCreatedResponse(options: WrappedResponseOptions) {
  return applyDecorators(
    ApiExtraModels(
      BaseSuccessResponseDto,
      options.dataDto,
      ...(options.metaDto ? [options.metaDto] : []),
    ),
    ApiResponse({
      status: 201,
      description: options.description,
      schema: buildWrappedSchema(options.dataDto, options.metaDto, options.isArray),
    }),
  );
}

export function ApiStandardErrorResponses(options?: {
  badRequest?: boolean;
  unauthorized?: boolean;
  forbidden?: boolean;
  notFound?: boolean;
  conflict?: boolean;
  validation?: boolean;
}) {
  const config = {
    badRequest: true,
    unauthorized: true,
    forbidden: true,
    notFound: false,
    conflict: false,
    validation: false,
    ...options,
  };

  return applyDecorators(
    ...(config.badRequest
      ? [ApiResponse({ status: 400, type: BadRequestResponseDto })]
      : []),
    ...(config.unauthorized
      ? [ApiResponse({ status: 401, type: UnauthorizedResponseDto })]
      : []),
    ...(config.forbidden
      ? [ApiResponse({ status: 403, type: ForbiddenResponseDto })]
      : []),
    ...(config.notFound
      ? [ApiResponse({ status: 404, type: NotFoundResponseDto })]
      : []),
    ...(config.conflict
      ? [ApiResponse({ status: 409, type: ConflictResponseDto })]
      : []),
    ...(config.validation
      ? [ApiUnprocessableEntityResponse({ type: ValidationErrorResponseDto })]
      : []),
  );
}
