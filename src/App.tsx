import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { ArrowRight, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { AssessmentsTab } from './components/AssessmentsTab';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header, type WorkspaceTab } from './components/Header';
import { OrganizationsTab } from './components/OrganizationsTab';
import { SafeImage } from './components/SafeImage';
import { SkillsPassportTab } from './components/SkillsPassportTab';
import { TrainingTab } from './components/TrainingTab';
import { HERO_WORKSHOP_IMAGE, PATHWAY_VISUALS } from './data/catalog';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  signInWithGoogle,
  signOutUser,
  testConnection,
} from './lib/firebase';
import type {
  AssessmentRequest,
  CertificateRecord,
  OrganizationConnection,
  SkillsProfile,
  TrainingEnrollment,
} from './types';

function SkillsBridgeApp() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('passport');
  const [loadingData, setLoadingData] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [profile, setProfile] = useState<SkillsProfile | null>(null);
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRequest[]>([]);
  const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([]);
  const [connections, setConnections] = useState<OrganizationConnection[]>([]);

  // Startup connection validation
  useEffect(() => {
    void testConnection();
  }, []);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (!currentUser) {
        setProfile(null);
        setCertificates([]);
        setAssessments([]);
        setEnrollments([]);
        setConnections([]);
        setLoadingData(false);
      }
    });
    return () => unsub();
  }, []);

  // Firestore real-time listeners (strictly attached only after auth is ready and user signed in)
  useEffect(() => {
    if (!authReady || !user) return;
    setLoadingData(true);

    const profileRef = doc(db, 'skillsProfiles', user.uid);
    const unsubProfile = onSnapshot(
      profileRef,
      (snap) => {
        if (snap.exists()) {
          setProfile({ id: snap.id, ...(snap.data() as Omit<SkillsProfile, 'id'>) });
        } else {
          setProfile(null);
        }
        setLoadingData(false);
      },
      (error) => handleFirestoreError(error, OperationType.GET, `skillsProfiles/${user.uid}`)
    );

    const certsQuery = query(
      collection(db, 'certificates'),
      where('ownerId', '==', user.uid)
    );
    const unsubCerts = onSnapshot(
      certsQuery,
      (snap) => {
        setCertificates(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CertificateRecord, 'id'>) }))
        );
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'certificates')
    );

    const assessQuery = query(
      collection(db, 'assessmentRequests'),
      where('ownerId', '==', user.uid)
    );
    const unsubAssess = onSnapshot(
      assessQuery,
      (snap) => {
        setAssessments(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AssessmentRequest, 'id'>) }))
        );
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'assessmentRequests')
    );

    const trainQuery = query(
      collection(db, 'trainingEnrollments'),
      where('ownerId', '==', user.uid)
    );
    const unsubTrain = onSnapshot(
      trainQuery,
      (snap) => {
        setEnrollments(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TrainingEnrollment, 'id'>) }))
        );
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'trainingEnrollments')
    );

    const connQuery = query(
      collection(db, 'organizationConnections'),
      where('ownerId', '==', user.uid)
    );
    const unsubConn = onSnapshot(
      connQuery,
      (snap) => {
        setConnections(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<OrganizationConnection, 'id'>),
          }))
        );
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'organizationConnections')
    );

    return () => {
      unsubProfile();
      unsubCerts();
      unsubAssess();
      unsubTrain();
      unsubConn();
    };
  }, [authReady, user]);

  const handleSignIn = useCallback(async (): Promise<User | null> => {
    setAuthError(null);
    try {
      const signedInUser = await signInWithGoogle();
      return signedInUser;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unable to sign in with Google.';
      setAuthError(msg);
      return null;
    }
  }, []);

  const handleSignOut = async () => {
    setAuthError(null);
    await signOutUser();
  };

  const scrollToWorkspace = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    const el = document.getElementById('workspace');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header onNavigateTab={setActiveTab} hasProfile={Boolean(profile)} />

      <main className="flex-1">
        {/* Hero Split */}
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-center">
                <p className="text-xs font-medium text-emerald-800 tracking-wide mb-3">
                  Kakuma &amp; Kalobeyei · Credential Recognition &amp; Skills Validation
                </p>
                <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.1] text-balance">
                  Your Skills Matter. Your Future Matters.
                </h1>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed mt-5 max-w-xl">
                  Kakuma SkillsBridge helps refugees document practical abilities, validate prior
                  qualifications—even when paper certificates were lost—and connect directly with
                  training providers and recognizing employers.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => scrollToWorkspace('passport')}
                    className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Register Your Skills
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToWorkspace('assessments')}
                    className="px-5 py-3 text-sm font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Request Practical Assessment
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="h-full min-h-[280px] lg:min-h-[380px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <SafeImage
                    src={HERO_WORKSHOP_IMAGE}
                    alt="Solar technician testing photovoltaic equipment at a Kakuma vocational workshop"
                    fallbackTitle="Kakuma Technical Assessment Workshop"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* 4-Column Quantitative Context Strip */}
            <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="font-display text-2xl font-bold text-slate-900 tabular-nums">
                  5 Core Steps
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Skills registry, certificate upload, assessment, bridging &amp; recognition
                </p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-slate-900 tabular-nums">
                  5 Kakuma Hubs
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Accredited workshops across Kakuma 1–4, Town &amp; Kalobeyei
                </p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-slate-900 tabular-nums">
                  Zero Paper Barrier
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Hands-on competency testing when original diplomas are missing
                </p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-slate-900 tabular-nums">
                  SDGs 4 &amp; 8
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Advancing Quality Education and Decent Work in Turkana West
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pathways & Mechanism Section */}
        <section id="pathways" className="max-w-7xl mx-auto px-6 py-14">
          <div className="max-w-2xl mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 text-balance">
              Practical pathways from displaced experience to recognized credentials
            </h2>
            <p className="text-base text-slate-600 mt-2.5 leading-relaxed">
              Whether you trained as an electrician, tailor, teacher, nurse, or IT technician
              before arriving in Kakuma, your competencies can be documented and verified.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PATHWAY_VISUALS.map((pathway) => (
              <article
                key={pathway.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] bg-slate-100 border-b border-slate-200 overflow-hidden">
                  <SafeImage
                    src={pathway.image}
                    alt={pathway.alt}
                    fallbackTitle={pathway.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">{pathway.meta}</p>
                    <h3 className="font-display text-lg font-bold text-slate-900">
                      {pathway.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{pathway.summary}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => scrollToWorkspace('assessments')}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-800 hover:text-emerald-900 cursor-pointer"
                  >
                    Request workshop assessment
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Interactive Workspace */}
        <section id="workspace" className="border-t border-slate-200 bg-slate-50 py-14">
          <div className="max-w-7xl mx-auto px-6 space-y-8">
            {/* Workspace Toolbar & Auth Control */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-slate-200">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
                  SkillsBridge Portal
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Manage your skills passport, upload documents, book practical evaluations, and
                  connect with recognizing bodies.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {user ? (
                  <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2 text-sm text-slate-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="truncate max-w-[200px] font-medium">
                        {user.displayName || user.email}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign out
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSignIn}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 text-emerald-700" />
                    Sign in with Google to Save Records
                  </button>
                )}
              </div>
            </div>

            {authError && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-900 text-sm px-4 py-3 rounded-lg"
              >
                {authError}
              </div>
            )}

            {/* Segmented Tab Bar */}
            <div
              role="tablist"
              aria-label="SkillsBridge workspace sections"
              className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-xl w-fit max-w-full"
            >
              {(
                [
                  { id: 'passport', label: '01. Skills Passport & Certificates' },
                  { id: 'assessments', label: `02. Practical Assessments (${assessments.length})` },
                  { id: 'training', label: '03. Training & Bridging' },
                  { id: 'organizations', label: '04. Recognizing Organizations' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active Tab Content */}
            <div>
              {activeTab === 'passport' && (
                <SkillsPassportTab
                  user={user}
                  profile={profile}
                  certificates={certificates}
                  loadingData={loadingData}
                  onRequireSignIn={handleSignIn}
                />
              )}
              {activeTab === 'assessments' && (
                <AssessmentsTab
                  user={user}
                  profile={profile}
                  requests={assessments}
                  loadingData={loadingData}
                  onRequireSignIn={handleSignIn}
                />
              )}
              {activeTab === 'training' && (
                <TrainingTab
                  user={user}
                  profile={profile}
                  enrollments={enrollments}
                  onRequireSignIn={handleSignIn}
                />
              )}
              {activeTab === 'organizations' && (
                <OrganizationsTab
                  user={user}
                  profile={profile}
                  connections={connections}
                  onRequireSignIn={handleSignIn}
                />
              )}
            </div>
          </div>
        </section>

        {/* SDG 4 & SDG 8 Alignment Section */}
        <section className="bg-white border-t border-slate-200 py-14">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <p className="font-mono text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                UN Sustainable Development Goal 4
              </p>
              <h3 className="font-display text-xl font-bold text-slate-900">
                Quality Education &amp; Lifelong Credential Recognition
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mt-2">
                Prevents years of prior study and technical apprenticeship from being erased by
                displacement, connecting learners to equivalency pathways, NITA trade tests, and
                targeted bridging scholarships.
              </p>
            </div>
            <div>
              <p className="font-mono text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                UN Sustainable Development Goal 8
              </p>
              <h3 className="font-display text-xl font-bold text-slate-900">
                Decent Work &amp; Economic Growth in Turkana West
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mt-2">
                Equips NGOs, local contractors, and remote employers with trustworthy proof of
                practical skills so qualified refugees in Kakuma and Kalobeyei can transition into
                fair, formal employment.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="font-display text-base font-bold text-white">Kakuma SkillsBridge</p>
            <p className="text-sm text-slate-400 mt-1">
              Your Skills Matter. Your Future Matters. · Kakuma Refugee Camp &amp; Kalobeyei
              Settlement
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <button
              type="button"
              onClick={() => scrollToWorkspace('passport')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Register Skills
            </button>
            <button
              type="button"
              onClick={() => scrollToWorkspace('assessments')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Assessments
            </button>
            <button
              type="button"
              onClick={() => scrollToWorkspace('training')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Training
            </button>
            <button
              type="button"
              onClick={() => scrollToWorkspace('organizations')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Partners
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SkillsBridgeApp />
    </ErrorBoundary>
  );
}
