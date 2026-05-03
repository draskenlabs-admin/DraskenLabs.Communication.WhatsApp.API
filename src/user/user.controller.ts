import { Controller, ForbiddenException, Get, Post, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UserProfileDto } from './dto/user-profile.dto';
import { ApiWrappedOkResponse } from 'src/common/responses/swagger.decorators';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiWrappedOkResponse({
    dataDto: UserProfileDto,
    description: 'Get user profile',
  })
  async getProfile(@Req() req: Request): Promise<UserProfileDto> {
    const user = (req as any).user;
    if (!user) {
      throw new UnauthorizedException('User not found in context');
    }
    return user;
  }

  @Post('test-token')
  @ApiOperation({ summary: 'Generate access token for user id 1 (Testing only)' })
  async generateTestToken() {
    if (this.configService.get('NODE_ENV') === 'production') {
      throw new ForbiddenException('Not available in production');
    }
    const userId = 1;
    const user = await this.userService.findById(userId);
    
    if (!user) {
      throw new UnauthorizedException('Test user with ID 1 not found. Please ensure it exists in the database.');
    }

    const token = await this.jwtService.signAsync({ sub: user.id, orgId: '', role: 'member' });

    return {
      access_token: token,
      user: { id: user.id, ssoId: user.ssoId },
    };
  }
}
