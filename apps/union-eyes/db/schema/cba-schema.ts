import { collectiveAgreements } from './collective-agreements-schema';

export const cba = collectiveAgreements;

export type Cba = typeof collectiveAgreements.$inferSelect;
export type NewCba = typeof collectiveAgreements.$inferInsert;
