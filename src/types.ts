export type CampZone =
  | 'Kakuma 1'
  | 'Kakuma 2'
  | 'Kakuma 3'
  | 'Kakuma 4'
  | 'Kalobeyei Village 1'
  | 'Kalobeyei Village 2'
  | 'Kalobeyei Village 3'
  | 'Kakuma Town';

export type RecordStatus =
  | 'documents_available'
  | 'partial_documents'
  | 'records_lost_in_displacement';

export type DocumentType =
  | 'Academic Transcript'
  | 'Trade Certificate'
  | 'Reference Letter'
  | 'Work Portfolio Photo'
  | 'Training Completion';

export type VerificationStatus =
  | 'Uploaded for Review'
  | 'Pending Equivalency'
  | 'Verified';

export type AssessmentCenter =
  | 'Kakuma Town Vocational Hub'
  | 'Kalobeyei Innovation Workshop'
  | 'Kakuma 3 Technical Annex'
  | 'Kakuma 1 Digital & ICT Lab'
  | 'Turkana West Health & Care Center';

export type AssessmentStatus =
  | 'Requested'
  | 'Scheduled'
  | 'Assessed'
  | 'Certified'
  | 'Withdrawn';

export type EnrollmentStatus =
  | 'Saved'
  | 'Applied'
  | 'Enrolled'
  | 'Completed'
  | 'Withdrawn';

export type RecognitionPurpose =
  | 'Qualification Equivalency'
  | 'Practical Assessment Referral'
  | 'Bridging Scholarship'
  | 'Employment Verification';

export type ConnectionStatus =
  | 'Sent'
  | 'In Review'
  | 'Connected'
  | 'Closed';

export interface SkillsProfile {
  id: string;
  ownerId: string;
  fullName: string;
  campZone: CampZone;
  countryOfOrigin: string;
  primaryTrade: string;
  yearsExperience: number;
  priorQualification: string;
  recordStatus: RecordStatus;
  contactPhone: string;
  languages: string[];
  competencies: string[];
  bio: string;
  passportCode: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CertificateRecord {
  id: string;
  ownerId: string;
  title: string;
  issuingInstitution: string;
  countryIssued: string;
  yearObtained: string;
  documentType: DocumentType;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  previewDataUrl: string;
  verificationStatus: VerificationStatus;
  notes: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AssessmentRequest {
  id: string;
  ownerId: string;
  applicantName: string;
  tradeCategory: string;
  assessmentCenter: AssessmentCenter;
  preferredWindow: string;
  hasDocuments: boolean;
  practicalSummary: string;
  status: AssessmentStatus;
  assessorFeedback: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface TrainingEnrollment {
  id: string;
  ownerId: string;
  programId: string;
  programTitle: string;
  provider: string;
  fundingType: string;
  motivation: string;
  status: EnrollmentStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface OrganizationConnection {
  id: string;
  ownerId: string;
  organizationId: string;
  organizationName: string;
  recognitionPurpose: RecognitionPurpose;
  applicantName: string;
  primaryTrade: string;
  message: string;
  status: ConnectionStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface TrainingProgram {
  id: string;
  title: string;
  provider: string;
  sector: 'Trades & Energy' | 'Digital & ICT' | 'Healthcare' | 'Business & Education';
  credentialAwarded: string;
  duration: string;
  deliveryMode: string;
  fundingType: string;
  location: string;
  summary: string;
  nextCohort: string;
}

export interface RecognizingOrganization {
  id: string;
  name: string;
  orgType: string;
  sectorFocus: string;
  location: string;
  recognitionScope: string;
  turnaround: string;
  description: string;
  supportedPurposes: RecognitionPurpose[];
}

export const FIELD_LIMITS = {
  FULL_NAME_MIN: 2,
  FULL_NAME_MAX: 100,
  COUNTRY_MIN: 2,
  COUNTRY_MAX: 80,
  TRADE_MIN: 2,
  TRADE_MAX: 100,
  QUALIFICATION_MAX: 200,
  PHONE_MAX: 30,
  BIO_MAX: 600,
  LANGUAGES_MAX: 10,
  COMPETENCIES_MAX: 12,
  CERT_TITLE_MAX: 140,
  INSTITUTION_MAX: 140,
  NOTES_MAX: 400,
  FILE_SIZE_MAX_BYTES: 450000,
  DATA_URL_MAX_CHARS: 650000,
  SUMMARY_MIN: 10,
  SUMMARY_MAX: 800,
  MOTIVATION_MAX: 500,
  MESSAGE_MIN: 10,
  MESSAGE_MAX: 600,
  PASSPORT_REGEX: /^KSB-[A-Z0-9]{6}$/,
  ID_REGEX: /^[a-zA-Z0-9_-]+$/,
} as const;
