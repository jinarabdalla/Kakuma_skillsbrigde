import { useState, type FormEvent } from 'react';
import { type User } from 'firebase/auth';
import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { AlertCircle, ArrowUpRight, CheckCircle2, Clock, X } from 'lucide-react';
import { RECOGNIZING_ORGANIZATIONS } from '../data/catalog';
import {
  createDocumentId,
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import {
  FIELD_LIMITS,
  type OrganizationConnection,
  type RecognitionPurpose,
  type RecognizingOrganization,
  type SkillsProfile,
} from '../types';

interface OrganizationsTabProps {
  user: User | null;
  profile: SkillsProfile | null;
  connections: OrganizationConnection[];
  onRequireSignIn: () => Promise<User | null>;
}

export function OrganizationsTab({
  user,
  profile,
  connections,
  onRequireSignIn,
}: OrganizationsTabProps) {
  const [selectedOrg, setSelectedOrg] = useState<RecognizingOrganization | null>(null);
  const [purpose, setPurpose] = useState<RecognitionPurpose>('Qualification Equivalency');
  const [applicantName, setApplicantName] = useState(profile?.fullName ?? user?.displayName ?? '');
  const [primaryTrade, setPrimaryTrade] = useState(profile?.primaryTrade ?? '');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const openConnectPanel = (org: RecognizingOrganization) => {
    setSelectedOrg(org);
    setPurpose(org.supportedPurposes[0]);
    setApplicantName(profile?.fullName ?? user?.displayName ?? '');
    setPrimaryTrade(profile?.primaryTrade ?? '');
    setFeedback(null);
  };

  const handleSendConnection = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    setFeedback(null);

    const activeUser = user ?? (await onRequireSignIn());
    if (!activeUser) {
      setFeedback({ type: 'err', text: 'Sign in with Google to send a recognition request.' });
      return;
    }

    const cleanName = applicantName.trim().slice(0, FIELD_LIMITS.FULL_NAME_MAX);
    const cleanTrade = primaryTrade.trim().slice(0, FIELD_LIMITS.TRADE_MAX);
    const cleanMsg = message.trim().slice(0, FIELD_LIMITS.MESSAGE_MAX);

    if (cleanName.length < FIELD_LIMITS.FULL_NAME_MIN || cleanTrade.length < FIELD_LIMITS.TRADE_MIN) {
      setFeedback({ type: 'err', text: 'Enter your name and primary trade or field.' });
      return;
    }
    if (cleanMsg.length < FIELD_LIMITS.MESSAGE_MIN) {
      setFeedback({
        type: 'err',
        text: 'Write at least 10 characters explaining the qualification or role you are connecting for.',
      });
      return;
    }

    const id = createDocumentId('conn');
    const path = `organizationConnections/${id}`;
    setSending(true);
    try {
      await setDoc(doc(db, 'organizationConnections', id), {
        ownerId: activeUser.uid,
        organizationId: selectedOrg.id,
        organizationName: selectedOrg.name.slice(0, 140),
        recognitionPurpose: purpose,
        applicantName: cleanName,
        primaryTrade: cleanTrade,
        message: cleanMsg,
        status: 'Sent',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setMessage('');
      setFeedback({
        type: 'ok',
        text: `Recognition inquiry sent to ${selectedOrg.name}. Typical response: ${selectedOrg.turnaround}.`,
      });
      setSelectedOrg(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setSending(false);
    }
  };

  const handleCloseConnection = async (id: string) => {
    try {
      await updateDoc(doc(db, 'organizationConnections', id), {
        status: 'Closed',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `organizationConnections/${id}`);
    }
  };

  return (
    <div className="space-y-10">
      {feedback && (
        <div
          role="status"
          className={`flex items-start gap-2.5 text-sm p-4 rounded-xl border ${
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

      {/* Connection Request Drawer / Panel */}
      {selectedOrg && (
        <form
          onSubmit={handleSendConnection}
          className="bg-white border border-emerald-700/40 rounded-xl p-6 md:p-8 space-y-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-emerald-800 mb-1">
                Connect With Recognizing Partner
              </p>
              <h3 className="font-display text-xl font-bold text-slate-900">{selectedOrg.name}</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {selectedOrg.orgType} · {selectedOrg.location}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedOrg(null)}
              aria-label="Close partner connection panel"
              className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="connName" className="block text-sm font-medium text-slate-800 mb-1.5">
                Your Name
              </label>
              <input
                id="connName"
                type="text"
                required
                maxLength={FIELD_LIMITS.FULL_NAME_MAX}
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder="Full name"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
              />
            </div>
            <div>
              <label htmlFor="connTrade" className="block text-sm font-medium text-slate-800 mb-1.5">
                Primary Skill or Qualification
              </label>
              <input
                id="connTrade"
                type="text"
                required
                maxLength={FIELD_LIMITS.TRADE_MAX}
                value={primaryTrade}
                onChange={(e) => setPrimaryTrade(e.target.value)}
                placeholder="e.g. Solar PV Installation"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
              />
            </div>
            <div>
              <label htmlFor="connPurpose" className="block text-sm font-medium text-slate-800 mb-1.5">
                Recognition Request Type
              </label>
              <select
                id="connPurpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as RecognitionPurpose)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
              >
                {selectedOrg.supportedPurposes.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="connMessage" className="block text-sm font-medium text-slate-800 mb-1.5">
              Message &amp; Qualification Details
            </label>
            <textarea
              id="connMessage"
              rows={3}
              required
              maxLength={FIELD_LIMITS.MESSAGE_MAX}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                profile
                  ? `Reference Passport ${profile.passportCode}: explain your prior qualification, country of origin, or practical assessment goal.`
                  : 'Explain your foreign qualification, missing certificate context, or employer verification need.'
              }
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setSelectedOrg(null)}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {sending ? 'Sending Inquiry...' : 'Send Recognition Request'}
            </button>
          </div>
        </form>
      )}

      {/* Partner Organizations Directory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {RECOGNIZING_ORGANIZATIONS.map((org) => (
          <article
            key={org.id}
            className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-6"
          >
            <div>
              <p className="text-xs text-slate-500 mb-2">
                <span>{org.orgType}</span>
                <span aria-hidden="true" className="mx-1.5">
                  ·
                </span>
                <span>{org.location}</span>
              </p>
              <h3 className="font-display text-lg font-bold text-slate-900">{org.name}</h3>
              <p className="text-xs font-medium text-emerald-800 mt-1">{org.sectorFocus}</p>
              <p className="text-sm text-slate-600 leading-relaxed mt-3">{org.recognitionScope}</p>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                <span>Turnaround: </span>
                <span className="font-medium text-slate-800 tabular-nums">{org.turnaround}</span>
              </div>
              <button
                type="button"
                onClick={() => openConnectPanel(org)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Connect
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* Sent Connections Table */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8">
        <div className="flex items-baseline justify-between gap-4 mb-5">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">
              My Partner Inquiries
            </h3>
            <p className="text-sm text-slate-600 mt-0.5">
              Active equivalency and employer verification threads linked to your account.
            </p>
          </div>
          <span className="font-mono text-xs text-slate-500 tabular-nums">
            {connections.length} sent
          </span>
        </div>

        {connections.length === 0 ? (
          <p className="text-sm text-slate-600 pt-4 border-t border-slate-200">
            You have not contacted a recognizing organization yet. Select Connect on any partner
            above to start verification.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 border-t border-slate-200">
            {connections.map((conn) => (
              <li key={conn.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{conn.organizationName}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    <span>{conn.recognitionPurpose}</span>
                    <span aria-hidden="true" className="mx-1.5">
                      ·
                    </span>
                    <span>{conn.primaryTrade}</span>
                  </p>
                  <p className="text-sm text-slate-700 mt-1.5">{conn.message}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800">
                    <Clock className="w-3.5 h-3.5" />
                    {conn.status}
                  </span>
                  {(conn.status === 'Sent' || conn.status === 'In Review') && (
                    <button
                      type="button"
                      onClick={() => handleCloseConnection(conn.id)}
                      className="text-xs text-slate-500 hover:text-red-700 underline underline-offset-4 cursor-pointer"
                    >
                      Close
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
