import { useMemo, useState, type FormEvent } from 'react';
import { type User } from 'firebase/auth';
import { deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { Bookmark, CheckCircle2, Search, X } from 'lucide-react';
import { TRAINING_PROGRAMS } from '../data/catalog';
import {
  createDocumentId,
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  FIELD_LIMITS,
  type SkillsProfile,
  type TrainingEnrollment,
  type TrainingProgram,
} from '../types';

interface TrainingTabProps {
  user: User | null;
  profile: SkillsProfile | null;
  enrollments: TrainingEnrollment[];
  onRequireSignIn: () => Promise<User | null>;
}

const SECTORS = [
  'All Sectors',
  'Trades & Energy',
  'Digital & ICT',
  'Healthcare',
  'Business & Education',
] as const;

export function TrainingTab({
  user,
  profile,
  enrollments,
  onRequireSignIn,
}: TrainingTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<(typeof SECTORS)[number]>('All Sectors');
  const [applyingProgram, setApplyingProgram] = useState<TrainingProgram | null>(null);
  const [motivation, setMotivation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const filteredPrograms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return TRAINING_PROGRAMS.filter((prog) => {
      const matchesSector = selectedSector === 'All Sectors' || prog.sector === selectedSector;
      const matchesSearch =
        !q ||
        prog.title.toLowerCase().includes(q) ||
        prog.provider.toLowerCase().includes(q) ||
        prog.credentialAwarded.toLowerCase().includes(q) ||
        prog.summary.toLowerCase().includes(q);
      return matchesSector && matchesSearch;
    });
  }, [searchQuery, selectedSector]);

  const enrollmentByProgramId = useMemo(() => {
    const map = new Map<string, TrainingEnrollment>();
    enrollments.forEach((e) => {
      map.set(e.programId, e);
    });
    return map;
  }, [enrollments]);

  const handleSaveProgram = async (program: TrainingProgram) => {
    setBannerMessage(null);
    const activeUser = user ?? (await onRequireSignIn());
    if (!activeUser) return;

    const existing = enrollmentByProgramId.get(program.id);
    if (existing) return;

    const id = createDocumentId('trn');
    try {
      await setDoc(doc(db, 'trainingEnrollments', id), {
        ownerId: activeUser.uid,
        programId: program.id,
        programTitle: program.title.slice(0, 140),
        provider: program.provider.slice(0, 120),
        fundingType: program.fundingType.slice(0, 80),
        motivation: '',
        status: 'Saved',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setBannerMessage(`Saved "${program.title}" to your training plan.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `trainingEnrollments/${id}`);
    }
  };

  const handleApplySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!applyingProgram) return;
    setBannerMessage(null);

    const activeUser = user ?? (await onRequireSignIn());
    if (!activeUser) return;

    const cleanMotivation = motivation.trim().slice(0, FIELD_LIMITS.MOTIVATION_MAX);
    const existing = enrollmentByProgramId.get(applyingProgram.id);
    setSubmitting(true);

    try {
      if (existing && (existing.status === 'Saved' || existing.status === 'Applied')) {
        await updateDoc(doc(db, 'trainingEnrollments', existing.id), {
          motivation: cleanMotivation,
          status: 'Applied',
          updatedAt: serverTimestamp(),
        });
      } else {
        const id = createDocumentId('trn');
        await setDoc(doc(db, 'trainingEnrollments', id), {
          ownerId: activeUser.uid,
          programId: applyingProgram.id,
          programTitle: applyingProgram.title.slice(0, 140),
          provider: applyingProgram.provider.slice(0, 120),
          fundingType: applyingProgram.fundingType.slice(0, 80),
          motivation: cleanMotivation,
          status: 'Applied',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setBannerMessage(`Application submitted for "${applyingProgram.title}".`);
      setApplyingProgram(null);
      setMotivation('');
    } catch (error) {
      handleFirestoreError(
        error,
        existing ? OperationType.UPDATE : OperationType.CREATE,
        'trainingEnrollments'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveEnrollment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'trainingEnrollments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `trainingEnrollments/${id}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {SECTORS.map((sector) => (
            <button
              key={sector}
              type="button"
              onClick={() => setSelectedSector(sector)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedSector === sector
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {sector}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses, NITA prep, providers..."
            aria-label="Search training opportunities"
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
          />
        </div>
      </div>

      {bannerMessage && (
        <div
          role="status"
          className="flex items-center justify-between gap-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm px-4 py-3 rounded-lg"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            {bannerMessage}
          </span>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            aria-label="Dismiss notification"
            className="text-emerald-800 hover:text-emerald-950 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Inline Application Panel */}
      {applyingProgram && (
        <form
          onSubmit={handleApplySubmit}
          className="bg-white border border-emerald-700/40 rounded-xl p-6 md:p-8 space-y-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-emerald-800 mb-1">
                Bridging &amp; Certification Application
              </p>
              <h3 className="font-display text-lg font-bold text-slate-900">
                {applyingProgram.title}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {applyingProgram.provider} · {applyingProgram.fundingType}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setApplyingProgram(null)}
              aria-label="Close application form"
              className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label htmlFor="trnMotivation" className="block text-sm font-medium text-slate-800 mb-1.5">
              Relevant background &amp; why you need this bridging cohort
            </label>
            <textarea
              id="trnMotivation"
              rows={3}
              maxLength={FIELD_LIMITS.MOTIVATION_MAX}
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              placeholder={
                profile
                  ? `Share how your experience in ${profile.primaryTrade} aligns with this course...`
                  : 'Briefly explain your prior experience or missing qualification you want to bridge...'
              }
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setApplyingProgram(null)}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      )}

      {/* Program Grid */}
      {filteredPrograms.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-base font-semibold text-slate-900">No training programs match your filter</p>
          <p className="text-sm text-slate-600 mt-1">
            Try switching to All Sectors or clearing your search keywords.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPrograms.map((program) => {
            const enrollment = enrollmentByProgramId.get(program.id);
            return (
              <article
                key={program.id}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-6"
              >
                <div>
                  <p className="text-xs text-slate-500 mb-2">
                    <span>{program.sector}</span>
                    <span aria-hidden="true" className="mx-1.5">
                      ·
                    </span>
                    <span>{program.duration}</span>
                    <span aria-hidden="true" className="mx-1.5">
                      ·
                    </span>
                    <span className="text-emerald-800 font-medium">{program.fundingType}</span>
                  </p>
                  <h3 className="font-display text-lg font-bold text-slate-900 leading-snug">
                    {program.title}
                  </h3>
                  <p className="text-sm font-medium text-slate-700 mt-1">{program.provider}</p>
                  <p className="text-sm text-slate-600 leading-relaxed mt-3">{program.summary}</p>
                </div>

                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <div className="text-xs text-slate-600 space-y-1">
                    <p>
                      <span className="font-medium text-slate-800">Credential:</span>{' '}
                      {program.credentialAwarded}
                    </p>
                    <p>
                      <span className="font-medium text-slate-800">Location:</span>{' '}
                      {program.location} · {program.nextCohort}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    {enrollment ? (
                      <div className="flex items-center justify-between w-full gap-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                          <CheckCircle2 className="w-4 h-4" />
                          Status: {enrollment.status}
                        </span>
                        <div className="flex items-center gap-3">
                          {enrollment.status === 'Saved' && (
                            <button
                              type="button"
                              onClick={() => {
                                setApplyingProgram(program);
                                setMotivation('');
                              }}
                              className="px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              Apply Now
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveEnrollment(enrollment.id)}
                            className="text-xs text-slate-500 hover:text-red-700 underline underline-offset-4 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSaveProgram(program)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setApplyingProgram(program);
                            setMotivation('');
                          }}
                          className="px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Apply for Bridging
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
