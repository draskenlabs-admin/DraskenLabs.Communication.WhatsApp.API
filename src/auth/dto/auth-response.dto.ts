import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty() id: number;
  @ApiProperty() clerkId: string;
  @ApiProperty() email: string;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty() status: boolean;
  @ApiProperty() createdAt: Date;
}

export class AuthResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}
