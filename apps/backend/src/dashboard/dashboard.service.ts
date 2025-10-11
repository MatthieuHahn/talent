import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CandidateStatus } from '../candidates/dto/candidate.dto';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(organizationId: string) {
    // Get current date and calculate time ranges
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Run queries in parallel for better performance
    const [totalCandidates, activeCandidates, newThisWeek, hiredThisMonth] =
      await Promise.all([
        // Total candidates
        this.prisma.candidate.count({
          where: { organizationId },
        }),

        // Active candidates (not hired, rejected, or blacklisted)
        this.prisma.candidate.count({
          where: {
            organizationId,
            status: {
              notIn: [
                CandidateStatus.HIRED,
                CandidateStatus.REJECTED,
                CandidateStatus.BLACKLISTED,
              ],
            },
          },
        }),

        // New candidates this week
        this.prisma.candidate.count({
          where: {
            organizationId,
            createdAt: {
              gte: oneWeekAgo,
            },
          },
        }),

        // Hired this month
        this.prisma.candidate.count({
          where: {
            organizationId,
            status: CandidateStatus.HIRED,
            updatedAt: {
              gte: oneMonthAgo,
            },
          },
        }),
      ]);

    return {
      totalCandidates,
      activeCandidates,
      newThisWeek,
      hiredThisMonth,
    };
  }

  async getRecentCandidates(organizationId: string, limit: number = 5) {
    return this.prisma.candidate.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
