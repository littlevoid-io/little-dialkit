import type { DialValue } from 'dialkit/vanilla';

/** Values by control path, as DialKit's store holds them. */
export type Values = Record<string, DialValue>;

function isAction(value: DialValue): boolean {
  return typeof value === 'object' && 'type' in value && value.type === 'action';
}

/** The values without the entries of action buttons. */
export function withoutActions(values: Values): Values {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => !isAction(value)));
}
