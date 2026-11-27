import type { InteractiveState } from '@barruu/engine';

export interface InteractiveProps<C, S extends InteractiveState> {
  config: C;
  state: S;
  /** `event` is a short past-tense description logged for the tutor ("set a to -1"). */
  onChange: (next: S, event?: string) => void;
  readOnly?: boolean;
  reducedMotion?: boolean;
}
