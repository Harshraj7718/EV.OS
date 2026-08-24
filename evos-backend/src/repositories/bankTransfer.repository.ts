import { BankTransferModel, IBankTransferDocument } from '../models/bankTransfer.model';
import { ICreateBankTransferDto, IBankTransferListQuery } from '../interfaces/bankTransfer.interface';

export class BankTransferRepository {
  async create(
    dto: ICreateBankTransferDto & { investmentAmount: number }
  ): Promise<IBankTransferDocument> {
    return BankTransferModel.create({
      ...dto,
      status: 'pending_review',
    });
  }

  async findAll(
    query: IBankTransferListQuery
  ): Promise<{ items: IBankTransferDocument[]; total: number }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const filter = query.status ? { status: query.status } : {};

    const [items, total] = await Promise.all([
      BankTransferModel.find(filter)
        .select('-invoiceFileData')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      BankTransferModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<IBankTransferDocument | null> {
    return BankTransferModel.findById(id).exec();
  }
}

export const bankTransferRepository = new BankTransferRepository();
