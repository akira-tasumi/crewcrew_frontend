// クルー関連のカスタムイベント

export type CrewExpUpdateEvent = {
  crewId: number;
  crewName: string;
  newExp: number;
  newLevel: number;
  expGained: number;
  leveledUp: boolean;
};

export const CREW_EXP_UPDATE_EVENT = 'crew-exp-update';

export function emitCrewExpUpdate(detail: CrewExpUpdateEvent) {
  const event = new CustomEvent(CREW_EXP_UPDATE_EVENT, { detail });
  window.dispatchEvent(event);
}

export function onCrewExpUpdate(callback: (event: CustomEvent<CrewExpUpdateEvent>) => void) {
  window.addEventListener(CREW_EXP_UPDATE_EVENT, callback as EventListener);
  return () => window.removeEventListener(CREW_EXP_UPDATE_EVENT, callback as EventListener);
}
