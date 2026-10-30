import { CheckCircle2, Download, LayoutTemplate, Redo2, Sparkles, Undo2 } from 'lucide-react';
import { recommendedSectionOrder } from '@/lib/resume/sections';
import { ModernTemplate } from '@/components/preview/AllTemplates';
import { ScaledResume } from '@/components/preview/ScaledResume';
import { landingDemoResume } from '@/components/home/landingDemoResume';

const SECTIONS = ['Personal Information', 'Professional Summary', 'Work Experience', 'Technical Skills', 'Projects', 'Education'];

function FakeField({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <p className="mb-1 text-[10px] font-medium text-ink">{label}</p>
      <p className="truncate rounded-md border border-line bg-surface px-2 py-1.5 text-[11px] text-ink">{value}</p>
    </div>
  );
}

// A faithful, non-interactive picture of the real resume workspace
// (PRD §7.2: "Show an actual resume editor preview").
export function EditorPreview() {
  const info = landingDemoResume.personalInfo;
  return (
    <div
      inert
      aria-hidden="true"
      className="overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.05),0_24px_48px_-24px_rgba(15,23,42,0.25)]"
    >
      <div className="flex items-center gap-3 whitespace-nowrap border-b border-line px-4 py-2.5">
        <span className="truncate text-[12px] font-semibold text-ink">Full Stack Developer Resume</span>
        <span className="hidden items-center gap-1 text-[11px] text-ink-2 xl:flex">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" /> All changes saved
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-1.5 text-ink-2">
          <Undo2 className="h-3.5 w-3.5" />
          <Redo2 className="h-3.5 w-3.5" />
          <span className="ml-1 hidden items-center gap-1 rounded-md border border-line px-2 py-1 text-[10px] font-medium text-ink sm:flex">
            <LayoutTemplate className="h-3 w-3" /> Modern Tech
          </span>
          <span className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[10px] font-semibold text-white">
            <Download className="h-3 w-3" /> Download PDF
          </span>
        </span>
      </div>
      <div className="grid md:grid-cols-[150px_1fr_1.15fr]">
        <ul className="hidden space-y-0.5 border-r border-line p-2 md:block">
          {SECTIONS.map((section, index) => (
            <li
              key={section}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px] ${index === 0 ? 'bg-primary-light font-semibold text-primary' : 'text-ink'}`}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
              <span className="truncate">{section}</span>
            </li>
          ))}
        </ul>
        <div className="hidden space-y-3 p-4 md:block">
          <p className="text-[13px] font-semibold text-ink">Personal Information</p>
          <div className="grid grid-cols-2 gap-2.5">
            <FakeField label="Full name" value={info.fullName} />
            <FakeField label="Target role" value={info.targetRole} />
            <FakeField label="Email" value={info.email} />
            <FakeField label="Phone" value={info.phone} />
            <FakeField label="LinkedIn URL" value="linkedin.com/in/aarav-mehta" wide />
          </div>
          <div className="rounded-md border border-line p-2.5">
            <p className="flex items-center justify-between text-[10px] font-medium text-ink">
              Professional summary
              <span className="flex items-center gap-1 text-primary">
                <Sparkles className="h-3 w-3" /> AI
              </span>
            </p>
            <p className="mt-1 line-clamp-3 text-[10px] leading-4 text-ink-2">{info.summary}</p>
          </div>
        </div>
        <div className="border-line bg-surface-2 p-3 md:border-l">
          <ScaledResume initialScale={0.42} visibleHeight={900} className="rounded-sm shadow-sm">
            <ModernTemplate data={landingDemoResume} accentColor="#4f46e5" sectionOrder={recommendedSectionOrder('experienced')} />
          </ScaledResume>
        </div>
      </div>
    </div>
  );
}
