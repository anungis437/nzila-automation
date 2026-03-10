# @nzila/ui

Shared React component library for NzilaOS applications.

## Components

| Component | Description |
|-----------|-------------|
| `Button` | Primary action button with variants |
| `Card` | Content container card |
| `Badge` | Status/label indicator |
| `Container` | Layout wrapper |
| `Sidebar` | Navigation sidebar |
| `SidebarItem` | Individual sidebar entry |
| `SidebarSection` | Sidebar grouping |

## Usage

```tsx
import { Button, Card, Badge } from '@nzila/ui'

export function MyComponent() {
  return (
    <Card>
      <Badge>Active</Badge>
      <Button onClick={handleClick}>Submit</Button>
    </Card>
  )
}
```

## Styles

Import `@nzila/ui/globals.css` in your app's root layout for base styles.

## Peer Dependencies

- `react` ^19.0.0
- `react-dom` ^19.0.0
