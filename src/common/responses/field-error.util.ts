import { ApiProperty } from '@nestjs/swagger';

export class FieldErrorResponse {
  @ApiProperty()
  field: string;

  @ApiProperty()
  message: string;
}
