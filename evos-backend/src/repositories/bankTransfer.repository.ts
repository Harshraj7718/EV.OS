import { BankTransferModel, IBankTransferDocument } from '../models/bankTransfer.model';
import { ICreateBankTransferDto } from '../interfaces/bankTransfer.interface';

export class BankTransferRepository {
  async create(
    dto: ICreateBankTransferDto & { investmentAmount: number }
  ): Promise<IBankTransferDocument> {
    return BankTransferModel.create({
      ...dto,
      status: 'pending_review',
    });
  }

  async findById(id: string): Promise<IBankTransferDocument | null> {
    return BankTransferModel.findById(id).exec();
  }
}

export const bankTransferRepository = new BankTransferRepository();
