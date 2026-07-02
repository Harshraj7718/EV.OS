import { Request, Response } from 'express';
import { leadService, LeadService } from '../services/lead.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ICreateLeadDto, IPaginationQuery } from '../interfaces/lead.interface';

export class LeadController {
  constructor(private readonly service: LeadService) {}

  createLead = asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as ICreateLeadDto;
    const lead = await this.service.createLead(dto);
    return ApiResponse.success(res, 201, 'Lead captured successfully', lead);
  });

  listLeads = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as IPaginationQuery;
    const result = await this.service.listLeads(query);
    return ApiResponse.success(res, 200, 'Leads retrieved successfully', result);
  });

  getLeadById = asyncHandler(async (req: Request, res: Response) => {
    const lead = await this.service.getLeadById(req.params.id);
    return ApiResponse.success(res, 200, 'Lead retrieved successfully', lead);
  });
}

export const leadController = new LeadController(leadService);
