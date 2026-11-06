import type { Link } from '../../../shared/bible';

export type VisualProps = {
  links: Link[];
  selected: string;
  onSelect: (id: string) => void;
  onHover: (l: Link | null) => void;
};
export const activate = (event: React.KeyboardEvent, action: () => void) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    action();
  }
};
