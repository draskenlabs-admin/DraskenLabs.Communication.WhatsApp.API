import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClerkService } from './clerk.service';
import { UserService } from 'src/user/user.service';
import { OrgService } from 'src/org/org.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly clerkService: ClerkService,
    private readonly userService: UserService,
    private readonly orgService: OrgService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<AuthResponseDto> {
    const clerkUser = await this.clerkService.createUser(
      dto.email,
      dto.password,
      dto.firstName,
      dto.lastName,
    );

    const user = await this.userService.findOrCreateByClerkId({
      clerkId: clerkUser.id,
      email: clerkUser.email_addresses[0].email_address,
      firstName: clerkUser.first_name,
      lastName: clerkUser.last_name,
    });

    const orgName = `${user.firstName}'s Organisation`;
    const { orgId, role } = await this.orgService.createOrg(orgName, user.id);

    const access_token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      orgId,
      role,
    });

    return { access_token, user };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const clerkId = await this.clerkService.signInWithPassword(dto.email, dto.password);

    let user = await this.userService.findByClerkId(clerkId);

    if (!user) {
      const clerkUser = await this.clerkService.getUserById(clerkId);
      const provisioned = await this.userService.findOrCreateByClerkId({
        clerkId: clerkUser.id,
        email: clerkUser.email_addresses[0].email_address,
        firstName: clerkUser.first_name,
        lastName: clerkUser.last_name,
      });
      const orgName = `${provisioned.firstName}'s Organisation`;
      await this.orgService.createOrg(orgName, provisioned.id);
      user = await this.userService.findById(provisioned.id);
    }

    if (!user || !user.status) {
      throw new UnauthorizedException('Account is deactivated');
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
