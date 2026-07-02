import { leadRepository, LeadRepository } from '../repositories/lead.repository';
import { ICreateLeadDto, IPaginatedResult, IPaginationQuery } from '../interfaces/lead.interface';
import { ILeadDocument } from '../models/lead.model';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

export class LeadService {
  constructor(private readonly repository: LeadRepository) {}

  async createLead(dto: ICreateLeadDto): Promise<ILeadDocument> {
    const existing = await this.repository.findByEmailOrPhone(dto.email, dto.phone);
    if (existing) {
      throw ApiError.conflict('A lead with this email or phone number already exists');
    }

    const lead = await this.repository.create(dto);
    logger.info(`New lead captured: ${lead.email} (${lead.interest})`);
    return lead;
  }

  async captureLeadSilently(dto: ICreateLeadDto): Promise<ILeadDocument> {
    const existing = await this.repository.findByEmailOrPhone(dto.email, dto.phone);
    if (existing) {
      return existing;
    }

    const lead = await this.repository.create(dto);
    logger.info(`New lead captured (silent): ${lead.email} (${lead.interest})`);
    return lead;
  }

  async listLeads(query: IPaginationQuery): Promise<IPaginatedResult<ILeadDocument>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;

    const { items, total } = await this.repository.findAll({ ...query, page, limit });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getLeadById(id: string): Promise<ILeadDocument> {
    const lead = await this.repository.findById(id);
    if (!lead) {
      throw ApiError.notFound('Lead not found');
    }
    return lead;
  }
}

export const leadService = new LeadService(leadRepository);
