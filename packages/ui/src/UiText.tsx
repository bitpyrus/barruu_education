import { createContext, useContext, type ReactNode } from 'react';
import { defaultUiTranslate, type UiTranslate } from './uiMessages';

const UiTextContext = createContext<UiTranslate>(defaultUiTranslate);

/** Supply the app's translator to every @barruu/ui component. */
export function UiTextProvider({ t, children }: { t: UiTranslate; children: ReactNode }) {
  return <UiTextContext.Provider value={t}>{children}</UiTextContext.Provider>;
}

export function useUiText(): UiTranslate {
  return useContext(UiTextContext);
}
