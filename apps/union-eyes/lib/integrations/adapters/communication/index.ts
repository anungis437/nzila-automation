/**
 * Communication Integrations Index
 * 
 * Exports all communication platform integrations
 */

export { SlackClient } from './slack-client';
export { SlackAdapter } from './slack-adapter';
export { TeamsClient } from './teams-client';
export { TeamsAdapter } from './teams-adapter';

export type {
  SlackChannel,
  SlackMessage,
  SlackUser,
  SlackFile,
} from './slack-client';

export type {
  TeamsTeam,
  TeamsChannel,
  TeamsMessage,
  TeamsMember,
  TeamsFile,
} from './teams-client';
