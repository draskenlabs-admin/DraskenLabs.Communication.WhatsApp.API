import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

interface ClerkUser {
  id: string;
  first_name: string;
  last_name: string;
  email_addresses: { email_address: string; id: string }[];
}

@Injectable()
export class ClerkService {
  private readonly secretKey: string;
  private readonly backendApiBase = 'https://api.clerk.com/v1';
  private readonly frontendApiBase: string;

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.getOrThrow<string>('CLERK_SECRET_KEY');
    const frontendApiUrl = this.configService.getOrThrow<string>('CLERK_FRONTEND_API_URL');
    this.frontendApiBase = `${frontendApiUrl}/v1`;
  }

  async createUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<ClerkUser> {
    try {
      const { data } = await axios.post<ClerkUser>(
        `${this.backendApiBase}/users`,
        {
          email_address: [email],
          password,
          first_name: firstName,
          last_name: lastName,
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return data;
    } catch (err) {
      const error = err as AxiosError<{ errors: { code: string; message: string }[] }>;
      const clerkError = error.response?.data?.errors?.[0];

      if (clerkError?.code === 'form_identifier_exists') {
        throw new ConflictException('An account with this email already exists');
      }

      throw new BadRequestException(clerkError?.message ?? 'Failed to create account in Clerk');
    }
  }

  async signInWithPassword(email: string, password: string): Promise<string> {
    try {
      const params = new URLSearchParams();
      params.append('identifier', email);
      params.append('strategy', 'password');
      params.append('password', password);

      const { data } = await axios.post(
        `${this.frontendApiBase}/client/sign_ins`,
        params.toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      const status = data?.response?.status as string | undefined;
      if (status !== 'complete') {
        throw new UnauthorizedException('Sign-in could not be completed');
      }

      const clerkId =
        (data?.client?.sessions as { user_id: string }[] | undefined)?.[0]?.user_id;

      if (!clerkId) {
        throw new UnauthorizedException('Could not resolve user identity from Clerk');
      }

      return clerkId;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;

      const error = err as AxiosError<{ errors: { code: string; message: string }[] }>;
      const clerkError = error.response?.data?.errors?.[0];

      if (
        clerkError?.code === 'form_password_incorrect' ||
        clerkError?.code === 'form_identifier_not_found'
      ) {
        throw new UnauthorizedException('Incorrect email or password');
      }

      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async getUserById(clerkId: string): Promise<ClerkUser> {
    try {
      const { data } = await axios.get<ClerkUser>(
        `${this.backendApiBase}/users/${clerkId}`,
        {
          headers: { Authorization: `Bearer ${this.secretKey}` },
        },
      );
      return data;
    } catch {
      throw new InternalServerErrorException('Failed to fetch user from Clerk');
    }
  }
}
