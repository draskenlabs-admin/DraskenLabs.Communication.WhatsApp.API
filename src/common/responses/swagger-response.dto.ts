import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FieldErrorResponse } from './field-error.util';

export class PaginationMetaDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class BaseSuccessResponseDto {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Success' })
  message: string;
}

export class RootDataDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  docs: string;

  @ApiProperty()
  openApiJson: string;
}

export class RootResponseDto extends BaseSuccessResponseDto {
  @ApiProperty({ type: () => RootDataDto })
  data: RootDataDto;
}

export class DeleteResponseDataDto {
  @ApiProperty()
  id: number;
}

export class DeleteResponseDto extends BaseSuccessResponseDto {
  @ApiProperty({ type: () => DeleteResponseDataDto })
  data: DeleteResponseDataDto;
}

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Error' })
  message: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: null,
  })
  data?: null;

  @ApiPropertyOptional({
    description: 'Optional error details.',
    type: 'array',
    items: { type: 'object' },
  })
  errors?: unknown;
}

export class BadRequestResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 400 })
  declare statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  declare message: string;
}

export class UnauthorizedResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 401 })
  declare statusCode: number;

  @ApiProperty({ example: 'Unauthorized' })
  declare message: string;
}

export class ForbiddenResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 403 })
  declare statusCode: number;

  @ApiProperty({ example: 'Forbidden' })
  declare message: string;
}

export class NotFoundResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 404 })
  declare statusCode: number;

  @ApiProperty({ example: 'Not found' })
  declare message: string;
}

export class ConflictResponseDto extends ErrorResponseDto {
  @ApiProperty({ example: 409 })
  declare statusCode: number;

  @ApiProperty({ example: 'Conflict' })
  declare message: string;
}

export class ValidationErrorResponseDto {
  @ApiProperty({ example: 422 })
  statusCode: number;

  @ApiProperty({ example: 'Field Validation Failed' })
  message: string;

  @ApiProperty({ type: () => [FieldErrorResponse] })
  errors: FieldErrorResponse[];

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: null,
    description: 'No data payload is returned for validation errors.',
  })
  data?: null;
}
