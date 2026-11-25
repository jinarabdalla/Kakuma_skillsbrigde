import { useEffect, useState, type FormEvent } from 'react';
import { type User } from 'firebase/auth';
import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { AlertCircle, CalendarCheck, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { ASSESSMENT_CENTERS, TRADE_CATEGORIES } from '../data/catalog';
import {
  createDocumentId,
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  FIELD_LIMITS,
  type AssessmentCenter,
  type AssessmentRequest,
  type SkillsProfile,
} from '../types';

interface AssessmentsTabProps {
  user: User | null;
  profile: SkillsProfile | null;
  requests: AssessmentRequest[];
  loadingData: boolean;
  onRequireSignIn: () => Promise<User | null>;
}

export function AssessmentsTab({
  user,
  profile,
  requests,
  loadingData,
  onRequireSignIn,
}: AssessmentsTabProps) {
  const [applicantName, setApplicantName] = useState('');
  const [tradeCategory, setTradeCategory] = useState(TRADE_CATEGORIES[0]);
  const [assessmentCenter, setAssessmentCenter] = useState<AssessmentCenter>(ASSESSMENT_CENTERS[0]);
  const [preferredWindow, setPreferredWindow] = useState('Weekday mornings (9:00 AM - 12:00 PM)');
  const [hasDocuments, setHasDocuments] = useState(false);
  const [practicalSummary, setPracticalSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setApplicantName(profile.fullName);
      setTradeCategory(profile.primaryTrade);
      setHasDocuments(profile.recordStatus !== 'records_lost_in_displacement');
    } else if (user?.displayName && !applicantName) {
      setApplicantName(user.displayName);
    }
  }, [profile, user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const activeUser = user ?? (await onRequireSignIn());
    if (!activeUser) {
      setFeedback({ type: 'err', text: 'Sign in with Google to book a practical assessment.' });
      return;
    }

    const cleanName = applicantName.trim().slice(0, FIELD_LIMITS.FULL_NAME_MAX);
    const cleanSummary = practicalSummary.trim().slice(0, FIELD_LIMITS.SUMMARY_MAX);
    const cleanWindow = preferredWindow.trim().slice(0, 80);

    if (cleanName.length < FIELD_LIMITS.FULL_NAME_MIN) {
      setFeedback({ type: 'err', text: 'Please enter the applicant full name.' });
      return;
    }
    if (cleanSummary.length < FIELD_LIMITS.SUMMARY_MIN) {
      setFeedback({
        type: 'err',
        text: 'Describe at least 10 characters of hands-on tasks you can demonstrate in the workshop.',
      });
      return;
    }

    const requestId = createDocumentId('assess');
    const path = `assessmentRequests/${requestId}`;
    setSubmitting(true);
    try {
      await setDoc(doc(db, 'assessmentRequests', requestId), {
        ownerId: activeUser.uid,
        applicantName: cleanName,
        tradeCategory,
        assessmentCenter,
        preferredWindow: cleanWindow,
        hasDocuments,
        practicalSummary: cleanSummary,
        status: 'Requested',
        assessorFeedback: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setPracticalSummary('');
      setFeedback({
        type: 'ok',
        text: 'Practical skills assessment requested. A Kakuma assessor will assign your bench date.',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (requestId: string) => {
    const path = `assessmentRequests/${requestId}`;
    try {
      await updateDoc(doc(db, 'assessmentRequests', requestId), {
        status: 'Withdrawn',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const renderStatusLabel = (status: AssessmentRequest['status']) => {
    switch (status) {
      case 'Certified':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Certified Competency
          </span>
        );
      case 'Scheduled':
      case 'Assessed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
            <CalendarCheck className="w-3.5 h-3.5" />
            {status}
          </span>
        );
      case 'Withdrawn':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <XCircle className="w-3.5 h-3.5" />
            Withdrawn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800">
            <Clock className="w-3.5 h-3.5" />
            Requested — Pending Scheduling
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      {/* Left: Request Form */}
      <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 md:p-8">
        <div className="mb-6">
          <h3 className="font-display text-xl font-bold text-slate-900">
            Request Practical Skills Assessment
          </h3>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            No certificate required. Demonstrate what you know in person at an accredited Kakuma or
            Kalobeyei workshop to earn a verified competency endorsement.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="assessName" className="block text-sm font-medium text-slate-800 mb-1.5">
                Applicant Name
              </label>
              <input
                id="assessName"
                type="text"
                required
                maxLength={FIELD_LIMITS.FULL_NAME_MAX}
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
              />
            </div>
            <div>
              <label htmlFor="assessTrade" className="block text-sm font-medium text-slate-800 mb-1.5">
                Trade or Competency Track
              </label>
              <select
                id="assessTrade"
                value={tradeCategory}
                onChange={(e) => setTradeCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
              >
                {TRADE_CATEGORIES.map((trade) => (
                  <option key={trade} value={trade}>
                    {trade}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="assessCenter" className="block text-sm font-medium text-slate-800 mb-1.5">
                Preferred Kakuma Assessment Center
              </label>
              <select
                id="assessCenter"
                value={assessmentCenter}
                onChange={(e) => setAssessmentCenter(e.target.value as AssessmentCenter)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
              >
                {ASSESSMENT_CENTERS.map((center) => (
                  <option key={center} value={center}>
                    {center}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="assessWindow" className="block text-sm font-medium text-slate-800 mb-1.5">
                Preferred Schedule Window
              </label>
              <select
                id="assessWindow"
                value={preferredWindow}
                onChange={(e) => setPreferredWindow(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
              >
                <option value="Weekday mornings (9:00 AM - 12:00 PM)">
                  Weekday mornings (9:00 AM - 12:00 PM)
                </option>
                <option value="Weekday afternoons (2:00 PM - 5:00 PM)">
                  Weekday afternoons (2:00 PM - 5:00 PM)
                </option>
                <option value="Saturday workshop session">Saturday workshop session</option>
              </select>
            </div>
          </div>

          <div className="flex items-start gap-2.5 pt-1">
            <input
              id="hasDocuments"
              type="checkbox"
              checked={hasDocuments}
              onChange={(e) => setHasDocuments(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
            />
            <label htmlFor="hasDocuments" className="text-sm text-slate-700">
              I also have partial paper certificates or reference letters to show the assessor
            </label>
          </div>

          <div>
            <label htmlFor="practicalSummary" className="block text-sm font-medium text-slate-800 mb-1.5">
              What practical tasks can you demonstrate?
            </label>
            <textarea
              id="practicalSummary"
              rows={4}
              required
              maxLength={FIELD_LIMITS.SUMMARY_MAX}
              value={practicalSummary}
              onChange={(e) => setPracticalSummary(e.target.value)}
              placeholder="Example: I can wire a 24V off-grid solar charge controller, crimp MC4 connectors, test battery bank voltage under load, and troubleshoot inverter faults."
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            />
          </div>

          {feedback && (
            <div
              role="status"
              className={`flex items-start gap-2.5 text-sm p-3.5 rounded-lg border ${
                feedback.type === 'ok'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {feedback.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-700" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-700" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-5 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {submitting ? 'Submitting Request...' : 'Submit Assessment Request'}
          </button>
        </form>
      </div>

      {/* Right: Assessment Requests Tracker */}
      <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 md:p-8">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-bold text-slate-900">
              Your Assessment Queue
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Track scheduled workshop evaluations and assessor endorsements.
            </p>
          </div>
          <span className="font-mono text-xs text-slate-500 tabular-nums shrink-0">
            {requests.length} total
          </span>
        </div>

        {loadingData ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-24 bg-slate-100 rounded-lg" />
            <div className="h-24 bg-slate-100 rounded-lg" />
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 border-t border-slate-200 text-center">
            <p className="text-sm font-medium text-slate-800">No assessment requests submitted yet</p>
            <p className="text-sm text-slate-600 mt-1 max-w-sm mx-auto">
              Use the form on the left to book a hands-on bench or clinical evaluation at a local
              Kakuma center.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 border-t border-slate-200">
            {requests.map((req) => (
              <li key={req.id} className="py-5 space-y-2.5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="font-display text-base font-bold text-slate-900">
                      {req.tradeCategory}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      <span>{req.assessmentCenter}</span>
                      <span aria-hidden="true" className="mx-1.5">
                        ·
                      </span>
                      <span>{req.preferredWindow}</span>
                    </p>
                  </div>
                  {renderStatusLabel(req.status)}
                </div>

                <p className="text-sm text-slate-700 leading-relaxed">{req.practicalSummary}</p>

                {req.assessorFeedback && (
                  <p className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    Assessor note: {req.assessorFeedback}
                  </p>
                )}

                {(req.status === 'Requested' || req.status === 'Scheduled') && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => handleWithdraw(req.id)}
                      className="text-xs font-medium text-slate-500 hover:text-red-700 underline underline-offset-4 cursor-pointer"
                    >
                      Withdraw request
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
