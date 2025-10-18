import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { User, JwtAuthGuard } from '../auth';
import type { AuthenticatedUser } from '../auth';
import { CandidateStatus } from '@talent/types';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getDashboardStats(@User() user: AuthenticatedUser): Promise<{
    totalCandidates: number;
    activeCandidates: number;
    newThisWeek: number;
    hiredThisMonth: number;
  }> {
    // Get organization from JWT token
    const organizationId = user.organizationId;

    return this.dashboardService.getDashboardStats(organizationId);
  }

  @Get('recent-candidates')
  async getRecentCandidates(@User() user: AuthenticatedUser): Promise<
    Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      status: CandidateStatus;
      createdAt: Date;
      updatedAt: Date;
    }>
  > {
    // Get organization from JWT token
    const organizationId = user.organizationId;

    return this.dashboardService.getRecentCandidates(organizationId);
  }
}
