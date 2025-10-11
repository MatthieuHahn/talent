import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { User, JwtAuthGuard } from '../auth';
import type { AuthenticatedUser } from '../auth';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getDashboardStats(@User() user: AuthenticatedUser) {
    // Get organization from JWT token
    const organizationId = user.organizationId;

    return this.dashboardService.getDashboardStats(organizationId);
  }

  @Get('recent-candidates')
  async getRecentCandidates(@User() user: AuthenticatedUser) {
    // Get organization from JWT token
    const organizationId = user.organizationId;

    return this.dashboardService.getRecentCandidates(organizationId);
  }
}
