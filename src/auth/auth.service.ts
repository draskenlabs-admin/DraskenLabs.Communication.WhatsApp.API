import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SsoService } from './sso.service';
import { UserService } from 'src/user/user.service';
import { OrgService } from 'src/org/org.service';
import { RedisService } from 'src/redis/redis.service';
import { AuthCallbackDto } from './dto/callback.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AuthorizeResponseDto } from './dto/authorize.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly ssoService: SsoService,
    private readonly userService: UserService,
    private readonly orgService: OrgService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async getAuthorizeUrl(redirectUri: string, codeChallenge: string): Promise<AuthorizeResponseDto> {
    const state = await this.redisService.createState();
    const url = this.ssoService.getAuthorizeUrl(redirectUri, codeChallenge, state);
    return { url, state };
  }

  async handleCallback(dto: AuthCallbackDto): Promise<AuthResponseDto> {
    const tokens = await this.ssoService.exchangeCode(dto.code, dto.codeVerifier, dto.redirectUri);
    const ssoUser = this.ssoService.decodeUserInfo(tokens.accessToken);

    let user = await this.userService.findOrCreateBySsoId({
      ssoId: ssoUser.ssoId,
      email: ssoUser.email,
      firstName: ssoUser.firstName,
      lastName: ssoUser.lastName,
    });

    if (!user.status) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (!user.activeOrgId) {
      const orgName = `${user.firstName}'s Organisation`;
      await this.orgService.createOrg(orgName, user.id);
      const refreshed = await this.userService.findById(user.id);
      if (refreshed) user = refreshed;
    }

    const orgId = user.activeOrgId;
    if (!orgId) throw new UnauthorizedException('No organisation found for this account');

    const role = await this.orgService.getMemberRole(orgId, user.id);
    if (!role) throw new UnauthorizedException('User is not a member of any organisation');

    const access_token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      orgId,
      role,
    });

    return { access_token, user };
  }
}
