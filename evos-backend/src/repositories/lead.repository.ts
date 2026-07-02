import { LeadModel, ILeadDocument } from '../models/lead.model';
import { ICreateLeadDto, IPaginationQuery } from '../interfaces/lead.interface';

export class LeadRepository {
  async create(dto: ICreateLeadDto): Promise<ILeadDocument> {
    return LeadModel.create(dto);
  }

  async findByEmailOrPhone(email: string, phone: string): Promise<ILeadDocument | null> {
    return LeadModel.findOne({ $or: [{ email }, { phone }] }).exec();
  }

  async findAll(query: IPaginationQuery): Promise<{ items: ILeadDocument[]; total: number }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const filter = query.interest ? { interest: query.interest } : {};

    const [items, total] = await Promise.all([
      LeadModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      LeadModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<ILeadDocument | null> {
    return LeadModel.findById(id).exec();
  }

  async deleteById(id: string): Promise<ILeadDocument | null> {
    return LeadModel.findByIdAndDelete(id).exec();
  }
}

export const leadRepository = new LeadRepository();
