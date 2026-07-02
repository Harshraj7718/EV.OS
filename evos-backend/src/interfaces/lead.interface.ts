export type LeadInterest = 'Investor' | 'Rider' | 'Business' | 'Other';

export interface ILead {
  name: string;
  email: string;
  phone: string;
  city: string;
  interest: LeadInterest;
  budget?: string;
  message?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateLeadDto {
  name: string;
  email: string;
  phone: string;
  city: string;
  interest: LeadInterest;
  budget?: string;
  message?: string;
}

export interface IPaginationQuery {
  page?: number;
  limit?: number;
  interest?: LeadInterest;
}

export interface IPaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
