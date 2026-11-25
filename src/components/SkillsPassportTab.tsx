import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { type User } from 'firebase/auth';
import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Printer,
  Trash2,
  Upload,
} from 'lucide-react';
import { CAMP_ZONES, DOCUMENT_TYPES, TRADE_CATEGORIES } from '../data/catalog';
import {
  createDocumentId,
  db,
  generatePassportCode,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  FIELD_LIMITS,
  type CampZone,
  type CertificateRecord,
  type DocumentType,
  type RecordStatus,
  type SkillsProfile,
} from '../types';

interface SkillsPassportTabProps {
  user: User | null;
  profile: SkillsProfile | null;
  certificates: CertificateRecord[];
  loadingData: boolean;
  onRequireSignIn: () => Promise<User | null>;
}

const RECORD_STATUS_LABELS: Record<RecordStatus, string> = {
  documents_available: 'Original certificates available',
  partial_documents: 'Partial records or copies available',
  records_lost_in_displacement: 'Certificates lost in displacement — requesting practical validation',
};

export function SkillsPassportTab({
  user,
  profile,
  certificates,
  loadingData,
  onRequireSignIn,
}: SkillsPassportTabProps) {
  const [fullName, setFullName] = useState('');
  const [campZone, setCampZone] = useState<CampZone>('Kakuma 1');
  const [countryOfOrigin, setCountryOfOrigin] = useState('');
  const [primaryTrade, setPrimaryTrade] = useState(TRADE_CATEGORIES[0]);
  const [yearsExperience, setYearsExperience] = useState('3');
  const [priorQualification, setPriorQualification] = useState('');
  const [recordStatus, setRecordStatus] = useState<RecordStatus>('records_lost_in_displacement');
  const [contactPhone, setContactPhone] = useState('');
  const [languagesInput, setLanguagesInput] = useState('English, Swahili');
  const [competenciesInput, setCompetenciesInput] = useState('');
  const [bio, setBio] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  // Certificate upload state
  const [certTitle, setCertTitle] = useState('');
  const [issuingInstitution, setIssuingInstitution] = useState('');
  const [countryIssued, setCountryIssued] = useState('');
  const [yearObtained, setYearObtained] = useState('2020');
  const [documentType, setDocumentType] = useState<DocumentType>('Trade Certificate');
  const [certNotes, setCertNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    previewDataUrl: string;
  } | null>(null);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [certFeedback, setCertFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setCampZone(profile.campZone);
      setCountryOfOrigin(profile.countryOfOrigin);
      setPrimaryTrade(profile.primaryTrade);
      setYearsExperience(String(profile.yearsExperience));
      setPriorQualification(profile.priorQualification);
      setRecordStatus(profile.recordStatus);
      setContactPhone(profile.contactPhone);
      setLanguagesInput(profile.languages.join(', '));
      setCompetenciesInput(profile.competencies.join(', '));
      setBio(profile.bio);
    } else if (user?.displayName && !fullName) {
      setFullName(user.displayName);
    }
  }, [profile, user]);

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileFeedback(null);

    const activeUser = user ?? (await onRequireSignIn());
    if (!activeUser) {
      setProfileFeedback({ type: 'err', text: 'Sign in with Google to save your Skills Passport.' });
      return;
    }

    const cleanName = fullName.trim().slice(0, FIELD_LIMITS.FULL_NAME_MAX);
    const cleanCountry = countryOfOrigin.trim().slice(0, FIELD_LIMITS.COUNTRY_MAX);
    const cleanTrade = primaryTrade.trim().slice(0, FIELD_LIMITS.TRADE_MAX);
    const cleanQual = priorQualification.trim().slice(0, FIELD_LIMITS.QUALIFICATION_MAX);
    const cleanPhone = contactPhone.trim().slice(0, FIELD_LIMITS.PHONE_MAX);
    const cleanBio = bio.trim().slice(0, FIELD_LIMITS.BIO_MAX);
    const expNum = Math.min(60, Math.max(0, Number(yearsExperience) || 0));

    const languages = languagesInput
      .split(',')
      .map((s) => s.trim().slice(0, 40))
      .filter(Boolean)
      .slice(0, FIELD_LIMITS.LANGUAGES_MAX);

    const competencies = competenciesInput
      .split(',')
      .map((s) => s.trim().slice(0, 80))
      .filter(Boolean)
      .slice(0, FIELD_LIMITS.COMPETENCIES_MAX);

    if (cleanName.length < FIELD_LIMITS.FULL_NAME_MIN) {
      setProfileFeedback({ type: 'err', text: 'Please enter your full name (at least 2 characters).' });
      return;
    }
    if (cleanCountry.length < FIELD_LIMITS.COUNTRY_MIN) {
      setProfileFeedback({ type: 'err', text: 'Please enter your country of origin or prior study.' });
      return;
    }
    if (languages.length === 0) {
      setProfileFeedback({ type: 'err', text: 'List at least one spoken or working language.' });
      return;
    }
    if (competencies.length === 0) {
      setProfileFeedback({
        type: 'err',
        text: 'Add at least one practical competency (e.g. Solar inverter wiring, Timber joinery).',
      });
      return;
    }

    setSavingProfile(true);
    const path = `skillsProfiles/${activeUser.uid}`;
    try {
      if (profile) {
        await updateDoc(doc(db, 'skillsProfiles', activeUser.uid), {
          fullName: cleanName,
          campZone,
          countryOfOrigin: cleanCountry,
          primaryTrade: cleanTrade,
          yearsExperience: expNum,
          priorQualification: cleanQual,
          recordStatus,
          contactPhone: cleanPhone,
          languages,
          competencies,
          bio: cleanBio,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'skillsProfiles', activeUser.uid), {
          ownerId: activeUser.uid,
          fullName: cleanName,
          campZone,
          countryOfOrigin: cleanCountry,
          primaryTrade: cleanTrade,
          yearsExperience: expNum,
          priorQualification: cleanQual,
          recordStatus,
          contactPhone: cleanPhone,
          languages,
          competencies,
          bio: cleanBio,
          passportCode: generatePassportCode(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setProfileFeedback({
        type: 'ok',
        text: 'Your Kakuma SkillsBridge Passport has been saved.',
      });
    } catch (error) {
      handleFirestoreError(error, profile ? OperationType.UPDATE : OperationType.CREATE, path);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCertFeedback(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > FIELD_LIMITS.FILE_SIZE_MAX_BYTES) {
      setCertFeedback({
        type: 'err',
        text: 'File exceeds 450 KB limit. Please compress or upload a clearer cropped scan.',
      });
      return;
    }

    const mimeType = file.type || 'application/octet-stream';
    if (mimeType.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        if (result.length > FIELD_LIMITS.DATA_URL_MAX_CHARS) {
          setCertFeedback({
            type: 'err',
            text: 'Encoded image preview is too large. Please resize the image under 350 KB.',
          });
          return;
        }
        setSelectedFile({
          fileName: file.name.slice(0, 160),
          mimeType: mimeType.slice(0, 80),
          fileSizeBytes: file.size,
          previewDataUrl: result,
        });
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile({
        fileName: file.name.slice(0, 160),
        mimeType: mimeType.slice(0, 80),
        fileSizeBytes: file.size,
        previewDataUrl: '',
      });
    }
  };

  const handleUploadCertificate = async (e: FormEvent) => {
    e.preventDefault();
    setCertFeedback(null);

    const activeUser = user ?? (await onRequireSignIn());
    if (!activeUser) {
      setCertFeedback({ type: 'err', text: 'Sign in with Google to store certificate records.' });
      return;
    }

    const cleanTitle = certTitle.trim().slice(0, FIELD_LIMITS.CERT_TITLE_MAX);
    const cleanInst = issuingInstitution.trim().slice(0, FIELD_LIMITS.INSTITUTION_MAX);
    const cleanCountry = countryIssued.trim().slice(0, FIELD_LIMITS.COUNTRY_MAX);
    const cleanYear = yearObtained.trim().slice(0, 12);
    const cleanNotes = certNotes.trim().slice(0, FIELD_LIMITS.NOTES_MAX);

    if (cleanTitle.length < 2 || cleanInst.length < 2 || cleanCountry.length < 2) {
      setCertFeedback({
        type: 'err',
        text: 'Provide the certificate title, issuing school/organization, and country.',
      });
      return;
    }

    const fileMeta = selectedFile ?? {
      fileName: 'declaration_record_reference.txt',
      mimeType: 'text/plain',
      fileSizeBytes: 0,
      previewDataUrl: '',
    };

    const certId = createDocumentId('cert');
    const path = `certificates/${certId}`;
    setUploadingCert(true);
    try {
      await setDoc(doc(db, 'certificates', certId), {
        ownerId: activeUser.uid,
        title: cleanTitle,
        issuingInstitution: cleanInst,
        countryIssued: cleanCountry,
        yearObtained: cleanYear.length >= 4 ? cleanYear : 'Unknown',
        documentType,
        fileName: fileMeta.fileName,
        mimeType: fileMeta.mimeType,
        fileSizeBytes: fileMeta.fileSizeBytes,
        previewDataUrl: fileMeta.previewDataUrl,
        verificationStatus: 'Uploaded for Review',
        notes: cleanNotes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setCertTitle('');
      setIssuingInstitution('');
      setCountryIssued('');
      setCertNotes('');
      setSelectedFile(null);
      setCertFeedback({
        type: 'ok',
        text: 'Document record added and queued for equivalency review.',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setUploadingCert(false);
    }
  };

  const handleDeleteCertificate = async (certId: string) => {
    const path = `certificates/${certId}`;
    try {
      await deleteDoc(doc(db, 'certificates', certId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <div className="space-y-12">
      {/* Live Skills Passport Summary */}
      {profile && (
        <section
          aria-label="Registered Skills Passport Summary"
          className="bg-white border border-slate-200 rounded-xl p-6 md:p-8"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 pb-6 border-b border-slate-200">
            <div>
              <p className="font-mono text-xs font-medium text-emerald-800 tracking-wide uppercase mb-1.5">
                Passport ID · {profile.passportCode}
              </p>
              <h3 className="font-display text-2xl font-bold text-slate-900">{profile.fullName}</h3>
              <p className="text-sm text-slate-600 mt-1">
                <span>{profile.primaryTrade}</span>
                <span aria-hidden="true" className="mx-2 text-slate-400">
                  ·
                </span>
                <span className="tabular-nums">{profile.yearsExperience} years experience</span>
                <span aria-hidden="true" className="mx-2 text-slate-400">
                  ·
                </span>
                <span>{profile.campZone}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Skills Summary
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-sm">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Prior Qualification &amp; Origin</p>
              <p className="text-slate-900 font-medium">
                {profile.priorQualification || 'Practical trade mastery'}
              </p>
              <p className="text-slate-600 mt-0.5">Origin: {profile.countryOfOrigin}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Documentation Status</p>
              <p className="text-slate-900 font-medium">{RECORD_STATUS_LABELS[profile.recordStatus]}</p>
              <p className="text-slate-600 mt-0.5">
                Languages: {profile.languages.join(' · ')}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Demonstrated Competencies</p>
              <p className="text-slate-800 leading-relaxed">{profile.competencies.join(' · ')}</p>
            </div>
          </div>
        </section>
      )}

      {/* Two-Column Split: Register Skills + Upload Certificates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Column 1: Register Skills & Qualifications */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 md:p-8">
          <div className="mb-6">
            <h3 className="font-display text-xl font-bold text-slate-900">
              01. Register Your Skills &amp; Qualifications
            </h3>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              Document your trade, education, and practical work history—even if your original paper
              records were lost during displacement.
            </p>
          </div>

          {loadingData ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-10 bg-slate-100 rounded-lg" />
              <div className="h-10 bg-slate-100 rounded-lg" />
              <div className="h-24 bg-slate-100 rounded-lg" />
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-slate-800 mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    maxLength={FIELD_LIMITS.FULL_NAME_MAX}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Amina Hassan Deng"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label htmlFor="campZone" className="block text-sm font-medium text-slate-800 mb-1.5">
                    Camp Zone / Settlement
                  </label>
                  <select
                    id="campZone"
                    value={campZone}
                    onChange={(e) => setCampZone(e.target.value as CampZone)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  >
                    {CAMP_ZONES.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="countryOfOrigin"
                    className="block text-sm font-medium text-slate-800 mb-1.5"
                  >
                    Country of Origin / Prior Study
                  </label>
                  <input
                    id="countryOfOrigin"
                    type="text"
                    required
                    maxLength={FIELD_LIMITS.COUNTRY_MAX}
                    value={countryOfOrigin}
                    onChange={(e) => setCountryOfOrigin(e.target.value)}
                    placeholder="e.g. South Sudan, Somalia, DRC"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-slate-800 mb-1.5">
                    Phone or Community Contact (Private)
                  </label>
                  <input
                    id="contactPhone"
                    type="tel"
                    maxLength={FIELD_LIMITS.PHONE_MAX}
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Optional e.g. +254 7XX XXX XXX"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="primaryTrade" className="block text-sm font-medium text-slate-800 mb-1.5">
                    Primary Trade or Profession
                  </label>
                  <select
                    id="primaryTrade"
                    value={primaryTrade}
                    onChange={(e) => setPrimaryTrade(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  >
                    {TRADE_CATEGORIES.map((trade) => (
                      <option key={trade} value={trade}>
                        {trade}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="yearsExperience"
                    className="block text-sm font-medium text-slate-800 mb-1.5"
                  >
                    Years Experience
                  </label>
                  <input
                    id="yearsExperience"
                    type="number"
                    min={0}
                    max={60}
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="priorQualification"
                  className="block text-sm font-medium text-slate-800 mb-1.5"
                >
                  Prior Qualification or Training Background
                </label>
                <input
                  id="priorQualification"
                  type="text"
                  maxLength={FIELD_LIMITS.QUALIFICATION_MAX}
                  value={priorQualification}
                  onChange={(e) => setPriorQualification(e.target.value)}
                  placeholder="e.g. 2-year Electrical Diploma at Juba Technical College, or 5 yrs apprenticeship"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                />
              </div>

              <div>
                <label htmlFor="recordStatus" className="block text-sm font-medium text-slate-800 mb-1.5">
                  Paper Record Availability
                </label>
                <select
                  id="recordStatus"
                  value={recordStatus}
                  onChange={(e) => setRecordStatus(e.target.value as RecordStatus)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                >
                  <option value="records_lost_in_displacement">
                    Lost in displacement — need practical competency assessment
                  </option>
                  <option value="partial_documents">
                    Partial copies or reference letters available
                  </option>
                  <option value="documents_available">
                    Original foreign certificates available for equivalency
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="languages" className="block text-sm font-medium text-slate-800 mb-1.5">
                    Working Languages (comma-separated)
                  </label>
                  <input
                    id="languages"
                    type="text"
                    required
                    value={languagesInput}
                    onChange={(e) => setLanguagesInput(e.target.value)}
                    placeholder="English, Swahili, Arabic"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label htmlFor="competencies" className="block text-sm font-medium text-slate-800 mb-1.5">
                    Key Practical Skills (comma-separated)
                  </label>
                  <input
                    id="competencies"
                    type="text"
                    required
                    value={competenciesInput}
                    onChange={(e) => setCompetenciesInput(e.target.value)}
                    placeholder="Solar wiring, Inverter sizing, Fault testing"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-slate-800 mb-1.5">
                  Brief Work Summary
                </label>
                <textarea
                  id="bio"
                  rows={3}
                  maxLength={FIELD_LIMITS.BIO_MAX}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe projects you have built, clinics or workshops you worked in, and the certification or job you are targeting."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                />
              </div>

              {profileFeedback && (
                <div
                  role="status"
                  className={`flex items-start gap-2.5 text-sm p-3.5 rounded-lg border ${
                    profileFeedback.type === 'ok'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  {profileFeedback.type === 'ok' ? (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-700" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-700" />
                  )}
                  <span>{profileFeedback.text}</span>
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs text-slate-500">
                  {user
                    ? `Signed in as ${user.email}`
                    : 'Clicking Save will ask you to sign in with Google to protect your records.'}
                </p>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {savingProfile
                    ? 'Saving Passport...'
                    : profile
                      ? 'Update Skills Passport'
                      : 'Save Skills Passport'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Column 2: Upload Certificates & Supporting Evidence */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8">
            <div className="mb-5">
              <h3 className="font-display text-xl font-bold text-slate-900">
                02. Upload Certificates (If Available)
              </h3>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Attach school transcripts, trade certificates, employer letters, or workshop photos
                for equivalency evaluation. Optional if records were lost.
              </p>
            </div>

            <form onSubmit={handleUploadCertificate} className="space-y-4">
              <div>
                <label htmlFor="certTitle" className="block text-sm font-medium text-slate-800 mb-1">
                  Document Title
                </label>
                <input
                  id="certTitle"
                  type="text"
                  required
                  maxLength={FIELD_LIMITS.CERT_TITLE_MAX}
                  value={certTitle}
                  onChange={(e) => setCertTitle(e.target.value)}
                  placeholder="e.g. National Diploma in Electrical Systems"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="docType" className="block text-sm font-medium text-slate-800 mb-1">
                    Document Type
                  </label>
                  <select
                    id="docType"
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  >
                    {DOCUMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="yearObtained" className="block text-sm font-medium text-slate-800 mb-1">
                    Year Obtained
                  </label>
                  <input
                    id="yearObtained"
                    type="text"
                    required
                    maxLength={12}
                    value={yearObtained}
                    onChange={(e) => setYearObtained(e.target.value)}
                    placeholder="2019"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="issuingInst" className="block text-sm font-medium text-slate-800 mb-1">
                    Issuing School or Body
                  </label>
                  <input
                    id="issuingInst"
                    type="text"
                    required
                    maxLength={FIELD_LIMITS.INSTITUTION_MAX}
                    value={issuingInstitution}
                    onChange={(e) => setIssuingInstitution(e.target.value)}
                    placeholder="e.g. Mogadishu Polytech"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>
                <div>
                  <label htmlFor="countryIssued" className="block text-sm font-medium text-slate-800 mb-1">
                    Country Issued
                  </label>
                  <input
                    id="countryIssued"
                    type="text"
                    required
                    maxLength={FIELD_LIMITS.COUNTRY_MAX}
                    value={countryIssued}
                    onChange={(e) => setCountryIssued(e.target.value)}
                    placeholder="e.g. Somalia"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="certFile"
                  className="flex items-center justify-between gap-3 px-4 py-3 border border-dashed border-slate-300 rounded-lg hover:border-emerald-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Upload className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="text-sm text-slate-700 truncate">
                      {selectedFile
                        ? `${selectedFile.fileName} (${Math.round(selectedFile.fileSizeBytes / 1024)} KB)`
                        : 'Attach PDF or image scan (max 450 KB)'}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-emerald-800 whitespace-nowrap shrink-0">
                    Browse File
                  </span>
                </label>
                <input
                  id="certFile"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </div>

              <div>
                <label htmlFor="certNotes" className="block text-sm font-medium text-slate-800 mb-1">
                  Translation or Verification Notes
                </label>
                <input
                  id="certNotes"
                  type="text"
                  maxLength={FIELD_LIMITS.NOTES_MAX}
                  value={certNotes}
                  onChange={(e) => setCertNotes(e.target.value)}
                  placeholder="Optional: language of document or witness contact"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
                />
              </div>

              {certFeedback && (
                <div
                  role="status"
                  className={`flex items-start gap-2 text-sm p-3 rounded-lg border ${
                    certFeedback.type === 'ok'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  {certFeedback.type === 'ok' ? (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-700" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-700" />
                  )}
                  <span>{certFeedback.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={uploadingCert}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {uploadingCert ? 'Uploading Record...' : 'Add Certificate Record'}
              </button>
            </form>
          </div>

          {/* Uploaded Certificates List */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h4 className="font-display text-base font-bold text-slate-900 mb-4">
              Uploaded Documents ({certificates.length})
            </h4>

            {certificates.length === 0 ? (
              <p className="text-sm text-slate-600 leading-relaxed">
                No paper documents uploaded yet. If your certificates were lost, mark your profile as
                lost records and request a Practical Assessment in the next tab.
              </p>
            ) : (
              <ul className="divide-y divide-slate-200">
                {certificates.map((cert) => (
                  <li key={cert.id} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex items-start gap-3">
                      {cert.previewDataUrl ? (
                        <img
                          src={cert.previewDataUrl}
                          alt={cert.title}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-slate-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{cert.title}</p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          <span>{cert.issuingInstitution}</span>
                          <span aria-hidden="true" className="mx-1.5">
                            ·
                          </span>
                          <span>{cert.countryIssued}</span>
                          <span aria-hidden="true" className="mx-1.5">
                            ·
                          </span>
                          <span className="tabular-nums">{cert.yearObtained}</span>
                        </p>
                        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 mt-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{cert.verificationStatus}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCertificate(cert.id)}
                      aria-label={`Remove ${cert.title}`}
                      className="p-2 text-slate-400 hover:text-red-700 rounded-lg transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
