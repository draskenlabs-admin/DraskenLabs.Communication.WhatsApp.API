import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClerkService } from './clerk.service';
import { UserService } from 'src/user/user.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly clerkService: ClerkService,
    private readonly userService: UserService,
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

    const access_token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return { access_token, user };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const clerkId = await this.clerkService.signInWithPassword(dto.email, dto.password);

    let user = await this.userService.findByClerkId(clerkId);

    if (!user) {
      // User exists in Clerk but not yet in our DB — provision it
      const clerkUser = await this.clerkService.getUserById(clerkId);
      user = await this.userService.findOrCreateByClerkId({
        clerkId: clerkUser.id,
        email: clerkUser.email_addresses[0].email_address,
        firstName: clerkUser.first_name,
        lastName: clerkUser.last_name,
      });
    }

    if (!user.status) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const access_token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return { access_token, user };
  }
}
