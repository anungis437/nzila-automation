# @nzila/integrations-m365

Microsoft 365 integration layer for the NzilaOS mobility platform. Provides SharePoint document storage, Outlook email logging, and Teams channel management via Microsoft Graph API.

## Domain context

Immigration case management requires document storage (SharePoint), advisor-client email tracking (Outlook), and team collaboration (Teams). This adapter abstracts Graph API calls behind typed interfaces with dependency injection.

## Public API surface

### SharePoint — `@nzila/integrations-m365/sharepoint`

| Export | Description |
|---|---|
| `attachSharePointFolder(graph, config, caseId)` | Create a case folder in SharePoint (`case-{caseId}`) |
| `uploadToSharePoint(graph, config, caseId, fileName, content)` | Upload a document to the case folder |
| `GraphClient` | Interface for Graph API calls (createFolder, uploadFile, getFileMetadata) |
| `SharePointConfig` | Site ID, drive ID, base folder path |

### Outlook — `@nzila/integrations-m365/outlook`

| Export | Description |
|---|---|
| `logEmailToCase(mail, userId, messageId, caseId, persist)` | Log an email message to a mobility case |
| `GraphMailClient` | Interface for Graph mail API (getMessages, getMessage) |
| `EmailLogEntry` | Logged entry with case ID, direction, timestamp |

### Teams — `@nzila/integrations-m365/teams`

| Export | Description |
|---|---|
| `createCaseChannel(teams, teamId, caseId, description?)` | Create a Teams channel for case collaboration |
| `GraphTeamsClient` | Interface for Graph Teams API (createChannel, getChannel) |

## Dependencies

- `@nzila/mobility-core` — Shared domain types
- `zod` — Runtime validation

## Example usage

```ts
import { attachSharePointFolder, uploadToSharePoint } from '@nzila/integrations-m365'

const folder = await attachSharePointFolder(graphClient, config, 'case-123')
const doc = await uploadToSharePoint(graphClient, config, 'case-123', 'passport.pdf', buffer)
```

## Related apps

- `apps/mobility` — Case document management
- `apps/console` — Admin document oversight

## Maturity

Pilot-grade — Typed interfaces with dependency injection. No tests yet. Graph API calls are stub implementations pending real Microsoft Graph SDK integration.
