'use client';

import { Check } from 'lucide-react';
import { useWorkspaceStore } from '@/store/useWorkspaceStore';
import { COLOR_OPTIONS, TEMPLATE_CATALOG } from '@/components/preview/templateCatalog';
import { ScaledResume } from '@/components/preview/ScaledResume';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';

// PRD §14 — preview before selection: every template shows YOUR resume.
export function TemplatePickerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const current = useWorkspaceStore((state) => state.current);
  const setTemplate = useWorkspaceStore((state) => state.setTemplate);
  const setAccentColor = useWorkspaceStore((state) => state.setAccentColor);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Choose a template"
      description="Your content stays the same — only the look changes. All templates are free and ATS-friendly."
      size="xl"
      footer={
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      }
    >
      {current && (
        <div className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-label font-medium text-ink">Accent color</legend>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => {
                const selected = current.accentColor === color.hex;
                return (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setAccentColor(color.hex)}
                    aria-pressed={selected}
                    aria-label={color.name}
                    title={color.name}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-transform ${
                      selected ? 'border-ink' : 'border-surface shadow-sm hover:scale-110'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    {selected && <Check className="h-4 w-4 text-white" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {TEMPLATE_CATALOG.map((template) => {
              const selected = current.templateId === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setTemplate(template.id)}
                  aria-pressed={selected}
                  className={`group rounded-xl border-2 p-2 text-left transition-colors ${
                    selected ? 'border-primary bg-primary-light' : 'border-line hover:border-line-strong'
                  }`}
                >
                  <ScaledResume initialScale={0.25} visibleHeight={1000} className="rounded-md border border-line">
                    <template.Component data={current.data} accentColor={current.accentColor} sectionOrder={current.sectionOrder} />
                  </ScaledResume>
                  <span className="mt-2 flex items-center justify-between gap-1 px-1">
                    <span className="text-small font-semibold text-ink">{template.name}</span>
                    {selected && <Check className="h-4 w-4 text-primary" aria-label="Selected" />}
                  </span>
                  <span className="block px-1 text-label text-ink-2">{template.bestFor}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Dialog>
  );
}
