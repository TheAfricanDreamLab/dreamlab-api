/** Admissions admitted someone to a cycle with a cohort: learning enrols them in it (ADM-1). */
export const APPLICANT_ADMITTED = 'applicant.admitted';

export interface ApplicantAdmitted {
  applicationId: string;
  userId: string;
  /** The admitting organisation; learning enrols only into a cohort it hosts. */
  orgId: string;
  cycleId: string;
  cohortId: string;
  programSlug: string;
  scholarshipPercent: number | null;
}
