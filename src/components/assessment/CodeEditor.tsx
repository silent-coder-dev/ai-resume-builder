'use client';

import { useEffect, useRef } from 'react';
import { indentWithTab } from '@codemirror/commands';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { python } from '@codemirror/lang-python';
import { SQLite, sql } from '@codemirror/lang-sql';
import { StreamLanguage, indentUnit } from '@codemirror/language';
import { csharp } from '@codemirror/legacy-modes/mode/clike';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, keymap } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import type { CodeLanguage } from '@/lib/assessment/languages';

export type EditorLanguage = CodeLanguage | 'sql';

const languageExtension = (language: EditorLanguage): Extension => {
  switch (language) {
    case 'python':
      return python();
    case 'java':
      return java();
    case 'c':
    case 'cpp':
      return cpp();
    case 'csharp':
      return StreamLanguage.define(csharp);
    case 'sql':
      return sql({ dialect: SQLite });
  }
};

// The code box. `documentKey` changes when a different file should be shown
// (another problem or language); plain typing never rebuilds the editor.
export function CodeEditor({
  documentKey,
  language,
  value,
  onChange,
  label,
  className = '',
}: {
  documentKey: string;
  language: EditorLanguage;
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const languageSlot = useRef(new Compartment());
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!hostRef.current) return;
    const view = new EditorView({
      parent: hostRef.current,
      state: EditorState.create({
        doc: '',
        extensions: [
          basicSetup,
          keymap.of([indentWithTab]),
          indentUnit.of('    '),
          languageSlot.current.of([]),
          oneDark,
          EditorView.contentAttributes.of({ 'aria-label': label, spellcheck: 'false', autocorrect: 'off', autocapitalize: 'off' }),
          EditorView.theme({ '&': { height: '100%', fontSize: '13px' }, '.cm-scroller': { fontFamily: 'var(--font-mono)' } }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
        ],
      }),
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [label]);

  // Switching file: swap the text and the language without firing onChange.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: languageSlot.current.reconfigure(languageExtension(language)),
      changes: view.state.doc.toString() === value ? undefined : { from: 0, to: view.state.doc.length, insert: value },
      annotations: [],
    });
    // Only when the file changes; typing already updates the text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentKey, language]);

  return <div ref={hostRef} className={`min-h-0 overflow-hidden ${className}`} />;
}
