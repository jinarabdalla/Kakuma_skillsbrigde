export type WorkspaceTab = 'passport' | 'assessments' | 'training' | 'organizations';

interface HeaderProps {
  onNavigateTab: (tab: WorkspaceTab) => void;
  hasProfile: boolean;
}

export function Header({ onNavigateTab, hasProfile }: HeaderProps) {
  const jumpToWorkspace = (tab: WorkspaceTab) => {
    onNavigateTab(tab);
    const el = document.getElementById('workspace');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        <a
          href="#top"
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"
        >
          Kakuma SkillsBridge
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <a
            href="#pathways"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Overview
          </a>
          <button
            type="button"
            onClick={() => jumpToWorkspace('passport')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Skills Passport
          </button>
          <button
            type="button"
            onClick={() => jumpToWorkspace('assessments')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Assessments
          </button>
          <button
            type="button"
            onClick={() => jumpToWorkspace('training')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Training
          </button>
          <button
            type="button"
            onClick={() => jumpToWorkspace('organizations')}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Organizations
          </button>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => jumpToWorkspace('passport')}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            {hasProfile ? 'My Passport' : 'Register Skills'}
          </button>
        </div>
      </div>
    </header>
  );
}
