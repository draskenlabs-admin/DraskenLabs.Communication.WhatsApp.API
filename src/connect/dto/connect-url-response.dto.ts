import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ConnectURLResponseDTO {
  @ApiProperty()
  @IsString()
  url: string;
}
