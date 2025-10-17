import React from "react";

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
}) => (
  <div
    key={job.id}
    className="card w-full p-6 flex flex-col justify-between rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 hover:shadow-lg transition group"
    onClick={onClick}
    style={{ cursor: "pointer" }}
  >
    <div className="font-bold text-xl mb-2 group-hover:text-blue-600 transition">
      {job.title}
    </div>
    <div className="text-gray-800 dark:text-gray-200 text-sm mb-1">
      {job.company?.name}
    </div>
    <div className="flex gap-2 mt-2 items-center">
      <button
        type="button"
        className="ml-auto px-3 py-1 rounded bg-purple-600 text-white text-xs font-semibold shadow hover:bg-purple-700 transition"
        onClick={(e) => {
          e.stopPropagation();
          if (onRematch) onRematch(job.id);
        }}
      >
        Re-match
      </button>
      {job.status && (
        <span className="inline-block px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold dark:bg-blue-900 dark:text-blue-200">
          {job.status}
        </span>
      )}
      {job.level && (
        <span className="inline-block px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-semibold dark:bg-gray-800 dark:text-gray-200">
          {job.level}
        </span>
      )}
    </div>
    {/* Candidate match info */}
    <div className="mt-2 text-xs text-green-800 dark:text-green-300">
      {matchesLoading ? (
        <span className="animate-pulse">Loading matches...</span>
      ) : jobMatches && jobMatches[job.id] ? (
        <>
          <span className="font-semibold">
            {jobMatches[job.id].matchedCandidates}
          </span>{" "}
          candidates matched
          {jobMatches[job.id].matchedCandidates > 0 && (
            <span className="ml-2">
              Best match score:{" "}
              <span className="font-semibold">
                {jobMatches[job.id].highestMatchScore.toFixed(0)}%
              </span>
            </span>
          )}
        </>
      ) : (
        "No candidates matched yet."
      )}
    </div>
    {/* Job description summary */}
    {job.description && (
      <div className="mt-3 text-gray-700 dark:text-gray-300 text-sm line-clamp-2">
        {job.description.length > 160
          ? job.description.slice(0, 160) + "..."
          : job.description}
      </div>
    )}
    {/* Technical and soft skills from requirementsDetailed.skills or job.skills */}
    {(job.requirementsDetailed?.skills || job.skills) && (
      <div className="mt-3">
        {/* Technical Skills */}
        {job.requirementsDetailed?.skills?.technical?.length > 0 && (
          <div className="mb-2">
            <span className="font-semibold text-xs text-blue-700 dark:text-blue-300 mr-2">
              Technical Skills:
            </span>
            <div className="flex flex-wrap gap-2 mt-1">
              {job.requirementsDetailed.skills.technical.map(
                (skill: string, idx: number) => (
                  <span
                    key={"tech-" + idx}
                    className="inline-block px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-semibold dark:bg-blue-900 dark:text-blue-200 border border-blue-100 dark:border-blue-800"
                  >
                    {skill}
                  </span>
                )
              )}
            </div>
          </div>
        )}
        {/* Soft Skills */}
        {job.requirementsDetailed?.skills?.soft?.length > 0 && (
          <div>
            <span className="font-semibold text-xs text-purple-700 dark:text-purple-300 mr-2">
              Soft Skills:
            </span>
            <div className="flex flex-wrap gap-2 mt-1">
              {job.requirementsDetailed.skills.soft.map(
                (skill: string, idx: number) => (
                  <span
                    key={"soft-" + idx}
                    className="inline-block px-2 py-1 rounded bg-purple-50 text-purple-700 text-xs font-semibold dark:bg-purple-900 dark:text-purple-200 border border-purple-100 dark:border-purple-800"
                  >
                    {skill}
                  </span>
                )
              )}
            </div>
          </div>
        )}
      </div>
    )}
  </div>
);

export default JobCard;
