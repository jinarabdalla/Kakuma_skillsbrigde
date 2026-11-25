import type {
  AssessmentCenter,
  CampZone,
  DocumentType,
  RecognizingOrganization,
  TrainingProgram,
} from '../types';

export const HERO_WORKSHOP_IMAGE =
  '/src/assets/images/hero_kakuma_workshop_1795608288380.jpg';

export const PATHWAY_VISUALS = [
  {
    id: 'tailoring',
    title: 'Tailoring & Textile Design',
    meta: 'NITA Grade III–I · Practical Bench Test',
    image: '/src/assets/images/pathway_tailoring_design_1795608288588.jpg',
    alt: 'Artisan tailor measuring and cutting patterned textile fabric at a wooden workbench in Kakuma',
    summary:
      'Pattern drafting, garment finishing, and industrial machine servicing validated directly on workshop samples.',
  },
  {
    id: 'digital',
    title: 'ICT Support & Digital Systems',
    meta: 'CISCO & ICDL Bridging · Lab Assessment',
    image: '/src/assets/images/pathway_digital_ict_1795608288886.jpg',
    alt: 'IT technician configuring a laptop and network switch at a community digital hub',
    summary:
      'Hardware diagnostics, local area networking, and web administration assessed through live troubleshooting labs.',
  },
  {
    id: 'carpentry',
    title: 'Carpentry, Solar & Construction',
    meta: 'KNQA Level 3–4 · Workshop Verification',
    image: '/src/assets/images/pathway_construction_carpentry_1795608289388.jpg',
    alt: 'Master carpenter verifying timber joinery squareness in a sunlit vocational workshop',
    summary:
      'Timber joinery, masonry layout, and off-grid solar PV wiring graded by certified Kenyan trade assessors.',
  },
];

export const CAMP_ZONES: CampZone[] = [
  'Kakuma 1',
  'Kakuma 2',
  'Kakuma 3',
  'Kakuma 4',
  'Kalobeyei Village 1',
  'Kalobeyei Village 2',
  'Kalobeyei Village 3',
  'Kakuma Town',
];

export const TRADE_CATEGORIES: string[] = [
  'Solar PV & Electrical Installation',
  'Carpentry & Timber Joinery',
  'Tailoring & Garment Production',
  'ICT Support & Networking',
  'Plumbing & Water Systems',
  'Community Health & Nursing Aid',
  'Metalwork & Welding',
  'Accounting & Micro-Enterprise Bookkeeping',
  'Teaching & Multilingual Education',
  'Automotive & Motorcycle Mechanics',
];

export const ASSESSMENT_CENTERS: AssessmentCenter[] = [
  'Kakuma Town Vocational Hub',
  'Kalobeyei Innovation Workshop',
  'Kakuma 3 Technical Annex',
  'Kakuma 1 Digital & ICT Lab',
  'Turkana West Health & Care Center',
];

export const DOCUMENT_TYPES: DocumentType[] = [
  'Trade Certificate',
  'Academic Transcript',
  'Reference Letter',
  'Work Portfolio Photo',
  'Training Completion',
];

export const TRAINING_PROGRAMS: TrainingProgram[] = [
  {
    id: 'prog_nita_solar_bridging',
    title: 'Solar PV Technician NITA Trade Test Prep',
    provider: 'Turkana West Technical Institute',
    sector: 'Trades & Energy',
    credentialAwarded: 'NITA Grade III / II Readiness Certificate',
    duration: '8 weeks · Part-time practical',
    deliveryMode: 'In-person workshop',
    fundingType: 'Full Scholarship Available',
    location: 'Kakuma Town Vocational Hub',
    summary:
      'Bridging module covering Kenyan solar safety codes, inverter sizing, and hands-on battery bank testing for experienced technicians missing home-country papers.',
    nextCohort: 'January 2027 Cohort',
  },
  {
    id: 'prog_ict_networking_bridge',
    title: 'IT Support & Network Administration Bridge',
    provider: 'Kakuma Digital Skills Guild',
    sector: 'Digital & ICT',
    credentialAwarded: 'CompTIA / KNQA Level 4 Micro-Credential',
    duration: '10 weeks · Hybrid lab',
    deliveryMode: 'Lab + Online coursework',
    fundingType: 'Sponsored Fee Waiver',
    location: 'Kakuma 1 Digital & ICT Lab',
    summary:
      'Structured competency validation and Linux/networking refresher enabling self-taught technicians and displaced IT graduates to qualify for remote and NGO IT roles.',
    nextCohort: 'Rolling Monthly Intake',
  },
  {
    id: 'prog_carpentry_joinery_upgrade',
    title: 'Precision Carpentry & Cabinet Making Certification',
    provider: 'Kalobeyei Artisans Cooperative',
    sector: 'Trades & Energy',
    credentialAwarded: 'KNQA Artisan Craft Certificate',
    duration: '6 weeks · Workshop intensive',
    deliveryMode: 'In-person workshop',
    fundingType: 'Tool-Kit & Exam Grant',
    location: 'Kalobeyei Innovation Workshop',
    summary:
      'Translates practical construction and furniture experience into standardized Kenyan blueprint reading, cost estimation, and assessed joinery benchmarks.',
    nextCohort: 'February 2027 Cohort',
  },
  {
    id: 'prog_community_health_equivalency',
    title: 'Community Health & Clinical Records Bridging',
    provider: 'East Africa Refugee Health Collaborative',
    sector: 'Healthcare',
    credentialAwarded: 'CHW Equivalency & Triage Endorsement',
    duration: '12 weeks · Clinical practicum',
    deliveryMode: 'Clinic + Classroom',
    fundingType: 'Stipend & Tuition Covered',
    location: 'Turkana West Health & Care Center',
    summary:
      'Evaluates prior nursing, midwifery, and pharmacy assistant experience from South Sudan, Somalia, DRC, and Burundi against Kenyan community health protocols.',
    nextCohort: 'March 2027 Cohort',
  },
  {
    id: 'prog_tailoring_enterprise',
    title: 'Commercial Tailoring & Pattern Grading Studio',
    provider: 'Rift Valley Craft & Enterprise Hub',
    sector: 'Trades & Energy',
    credentialAwarded: 'Certified Master Tailor Portfolio',
    duration: '6 weeks · Studio sessions',
    deliveryMode: 'In-person studio',
    fundingType: 'Free Community Access',
    location: 'Kakuma 3 Technical Annex',
    summary:
      'Supports experienced tailors in documenting measurement standards, bulk uniform production, and quality assurance checklists recognized by regional procurement tenders.',
    nextCohort: 'January 2027 Cohort',
  },
  {
    id: 'prog_bookkeeping_digital_finance',
    title: 'Small Business Accounting & Cooperative Finance',
    provider: 'Turkana Livelihoods Academy',
    sector: 'Business & Education',
    credentialAwarded: 'Certified Micro-Enterprise Bookkeeper',
    duration: '5 weeks · Morning classes',
    deliveryMode: 'In-person + Workbook',
    fundingType: 'Full Scholarship Available',
    location: 'Kakuma Town Vocational Hub',
    summary:
      'Equips traders, former clerks, and commerce graduates with Kenyan tax compliance basics, mobile ledger workflows, and audited financial statement preparation.',
    nextCohort: 'February 2027 Cohort',
  },
  {
    id: 'prog_multilingual_pedagogy',
    title: 'Accelerated Teaching Equivalency & Classroom Practice',
    provider: 'Kakuma Education Access Network',
    sector: 'Business & Education',
    credentialAwarded: 'Verified Community Educator Credential',
    duration: '8 weeks · Practicum + Seminar',
    deliveryMode: 'School placement',
    fundingType: 'Sponsored Fee Waiver',
    location: 'Kakuma 2 Learning Center',
    summary:
      'Bridging pathway for experienced teachers whose diplomas were left behind, combining observed classroom lessons with Kenyan competency-based curriculum standards.',
    nextCohort: 'January 2027 Cohort',
  },
  {
    id: 'prog_web_data_annotation',
    title: 'Applied Web Development & Data Operations Track',
    provider: 'Turkana Remote Work Collective',
    sector: 'Digital & ICT',
    credentialAwarded: 'Verified Junior Web & Data Specialist',
    duration: '12 weeks · Mentored cohort',
    deliveryMode: 'Computer lab + Remote mentors',
    fundingType: 'Laptop Access & Exam Grant',
    location: 'Kakuma 1 Digital & ICT Lab',
    summary:
      'Portfolio-first engineering track where learners build verified client projects and pass technical code reviews for regional and international remote placements.',
    nextCohort: 'March 2027 Cohort',
  },
];

export const RECOGNIZING_ORGANIZATIONS: RecognizingOrganization[] = [
  {
    id: 'org_knqa_turkana_desk',
    name: 'Turkana West TVET & Equivalency Desk',
    orgType: 'Qualification Assessment Body',
    sectorFocus: 'Vocational Trades, Solar, Construction & Tailoring',
    location: 'Kakuma Town & Lodwar',
    recognitionScope:
      'Issues Recognition of Prior Learning (RPL) equivalencies and schedules official NITA Grade III–I practical trade tests even without original school transcripts.',
    turnaround: '10–14 business days',
    description:
      'Connect directly to request prior-learning assessment, trade test fee vouchers, or formal recognition of foreign technical certificates.',
    supportedPurposes: [
      'Qualification Equivalency',
      'Practical Assessment Referral',
      'Bridging Scholarship',
    ],
  },
  {
    id: 'org_kakuma_livelihoods_consortium',
    name: 'Kakuma & Kalobeyei Livelihoods Employers Council',
    orgType: 'Employer & Procurement Consortium',
    sectorFocus: 'Solar Energy, Water Systems, Construction & Logistics',
    location: 'Kakuma 1–4 & Kalobeyei Settlement',
    recognitionScope:
      'Accepts Kakuma SkillsBridge Practical Assessment Passports in place of missing diplomas for skilled contractor and technician hiring.',
    turnaround: '5–7 business days',
    description:
      'Regional NGOs, solar mini-grid operators, and WASH contractors review verified Skills Passports when recruiting local technical teams.',
    supportedPurposes: ['Employment Verification', 'Practical Assessment Referral'],
  },
  {
    id: 'org_ea_health_bridge',
    name: 'East Africa Healthcare Credentials Bridge',
    orgType: 'Health Sector Recognition Partner',
    sectorFocus: 'Nursing, Midwifery, Lab Assistants & Community Health',
    location: 'Kakuma Town & Nairobi Liaison',
    recognitionScope:
      'Reviews partial medical/nursing transcripts, conducts supervised clinical competency checks, and funds licensing exam preparation.',
    turnaround: '14–21 business days',
    description:
      'Supports displaced health professionals in navigating Kenyan regulatory equivalency and qualifying for clinic assistant or health educator posts.',
    supportedPurposes: [
      'Qualification Equivalency',
      'Bridging Scholarship',
      'Employment Verification',
    ],
  },
  {
    id: 'org_rift_digital_guild',
    name: 'Rift Valley Digital Employment Guild',
    orgType: 'Remote Work & Tech Talent Partner',
    sectorFocus: 'IT Support, Web Development, Data & Digital Operations',
    location: 'Kakuma 1 Hub & Remote',
    recognitionScope:
      'Validates real coding, hardware, and data portfolios through live technical interviews to connect refugees with regional employers.',
    turnaround: '7 business days',
    description:
      'Ideal for self-taught developers, ICT support technicians, and displaced university graduates seeking portfolio-backed work verification.',
    supportedPurposes: ['Practical Assessment Referral', 'Employment Verification'],
  },
  {
    id: 'org_turkana_education_board',
    name: 'Turkana Higher Education & Teaching Equivalency Panel',
    orgType: 'Academic & Educator Recognition Board',
    sectorFocus: 'Primary/Secondary Teaching, Languages & Early Childhood',
    location: 'Kakuma 2 & Kalobeyei',
    recognitionScope:
      'Evaluates foreign secondary/university teaching credentials and provides fast-track pedagogy observation for community school placements.',
    turnaround: '10–15 business days',
    description:
      'Helps former teachers and university degree holders verify subject mastery and qualify for stipended teaching fellowships across camp schools.',
    supportedPurposes: [
      'Qualification Equivalency',
      'Bridging Scholarship',
      'Employment Verification',
    ],
  },
  {
    id: 'org_craft_trade_finance',
    name: 'Kalobeyei Enterprise & Trade Accreditation Fund',
    orgType: 'Micro-Enterprise & Craft Partner',
    sectorFocus: 'Tailoring, Carpentry, Welding & Bookkeeping',
    location: 'Kalobeyei Village 1–3',
    recognitionScope:
      'Recognizes certified workshop artisans for cooperative procurement contracts, equipment micro-grants, and apprenticeship host stipends.',
    turnaround: '7–10 business days',
    description:
      'Bridges verified artisans into formal local supply chains, school uniform contracts, and carpentry tenders across Turkana County.',
    supportedPurposes: [
      'Practical Assessment Referral',
      'Bridging Scholarship',
      'Employment Verification',
    ],
  },
];
