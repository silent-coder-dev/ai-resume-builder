import { extendTailwindMerge } from 'tailwind-merge';

// Merges Tailwind classes so later ones win (e.g. a caller's "hidden" beats a
// component's "inline-flex"). Knows the PRD type scale so "text-body" is read
// as a font size, not a color.
const merge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['hero', 'title', 'heading', 'card', 'body', 'small', 'label'],
    },
  },
});

export function cn(...classes: Array<string | false | null | undefined>) {
  return merge(classes.filter(Boolean).join(' '));
}
