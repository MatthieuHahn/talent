import React from "react";
import { RefreshCw, MapPin, Clock, Users, TrendingUp } from "lucide-react";

export interface JobCardProps {
  job: any;
  matchesLoading?: boolean;
  jobMatches?: Record<
    string,
    { matchedCandidates: number; highestMatchScore: number }
  >;
  onClick?: () => void;
  locale?: string;
  onRematch?: (jobId: string) => void;
}

const JobCard: React.FC<JobCardProps> = ({
  job,
  matchesLoading,
  jobMatches,
  onClick,
  locale,
  onRematch,
}) => {
  const matchInfo = jobMatches?.[job.id];

  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        {/* Main Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
              {job.title}
            </h3>
            <div className="flex gap-2 ml-4">
              {job.status && (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    job.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  {job.status}
                </span>
              )}
              {job.level && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  {job.level}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
            {job.company?.name && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.company.name}
              </div>
            )}
            {job.createdAt && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(job.createdAt).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Match Statistics */}
          {matchInfo && (
            <div className="flex items-center gap-6 mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {matchInfo.matchedCandidates} matches
                </span>
              </div>
              {matchInfo.matchedCandidates > 0 && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {matchInfo.highestMatchScore.toFixed(0)}% best match
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Job Description */}
          {job.description && (
            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-4 line-clamp-2">
              {job.description.length > 200
                ? job.description.slice(0, 200) + "..."
                : job.description}
            </p>
          )}

          {/* Skills */}
          {(job.requirementsDetailed?.skills || job.skills) && (
            <div className="space-y-3">
              {/* Technical Skills */}
              {job.requirementsDetailed?.skills?.technical?.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-2 block">
                    Technical Skills
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {job.requirementsDetailed.skills.technical
                      .slice(0, 5)
                      .map((skill: string, idx: number) => (
                        <span
                          key={"tech-" + idx}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                    {job.requirementsDetailed.skills.technical.length > 5 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        +{job.requirementsDetailed.skills.technical.length - 5}{" "}
                        more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Soft Skills */}
              {job.requirementsDetailed?.skills?.soft?.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide mb-2 block">
                    Soft Skills
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {job.requirementsDetailed.skills.soft
                      .slice(0, 5)
                      .map((skill: string, idx: number) => (
                        <span
                          key={"soft-" + idx}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                        >
                          {skill}
                        </span>
                      ))}
                    {job.requirementsDetailed.skills.soft.length > 5 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        +{job.requirementsDetailed.skills.soft.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 lg:min-w-[140px]">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onRematch) onRematch(job.id);
            }}
            disabled={matchesLoading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed"
          >
            {matchesLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Re-match
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
