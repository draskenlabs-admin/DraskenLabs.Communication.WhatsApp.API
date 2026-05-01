import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateContactDto, UpdateContactDto, ContactResponseDto } from './dto/contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orgId: number, dto: CreateContactDto): Promise<ContactResponseDto> {
    const existing = await this.prisma.contact.findUnique({
      where: { orgId_phone: { orgId, phone: dto.phone } },
    });
    if (existing) throw new BadRequestException('A contact with this phone number already exists');

    const contact = await this.prisma.contact.create({
      data: {
        orgId,
        phone: dto.phone,
        name: dto.name ?? null,
        email: dto.email ?? null,
        metadata: dto.metadata ?? undefined,
      },
    });

    return this.toDto(contact);
  }

  async findAll(orgId: number): Promise<ContactResponseDto[]> {
    const contacts = await this.prisma.contact.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });
    return contacts.map(this.toDto);
  }

  async findOne(orgId: number, id: number): Promise<ContactResponseDto> {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact || contact.orgId !== orgId) throw new NotFoundException('Contact not found');
    return this.toDto(contact);
  }

  async update(orgId: number, id: number, dto: UpdateContactDto): Promise<ContactResponseDto> {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact || contact.orgId !== orgId) throw new NotFoundException('Contact not found');

    const updated = await this.prisma.contact.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.optedOut !== undefined && { optedOut: dto.optedOut }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata }),
      },
    });

    return this.toDto(updated);
  }

  async remove(orgId: number, id: number): Promise<void> {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact || contact.orgId !== orgId) throw new NotFoundException('Contact not found');
    await this.prisma.contact.delete({ where: { id } });
  }

  async isOptedOut(orgId: number, phone: string): Promise<boolean> {
    const contact = await this.prisma.contact.findUnique({
      where: { orgId_phone: { orgId, phone } },
      select: { optedOut: true },
    });
    return contact?.optedOut ?? false;
  }

  private toDto(c: any): ContactResponseDto {
    return {
      id: c.id,
      phone: c.phone,
      name: c.name ?? undefined,
      email: c.email ?? undefined,
      optedOut: c.optedOut,
      metadata: c.metadata ?? undefined,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }
}
