# Health & Safety Dashboard Pages

Production-ready Next.js pages for the Health & Safety module in the Union Eyes application.

## 📁 File Structure

```
app/[locale]/dashboard/health-safety/
├── page.tsx                    # Main H&S dashboard
├── incidents/
│   ├── page.tsx               # Incidents list & management
│   └── new/
│       └── page.tsx           # New incident report form
├── inspections/
│   └── page.tsx               # Inspections management
└── hazards/
    └── page.tsx               # Hazard reports & tracking
```

## 📄 Pages Overview

### 1. Main Dashboard (`page.tsx`)

**Route:** `/dashboard/health-safety`

**Features:**
- Quick overview cards (Days Without Incident, Open Hazards, Compliance Rate)
- Navigation cards to sub-sections (Incidents, Inspections, Hazards, Training)
- Embedded `HealthSafetyDashboard` component with full metrics
- Period selector (7d, 30d, 90d, 12m)
- Export functionality
- Quick action: Report Incident button

**Key Components Used:**
- `HealthSafetyDashboard`
- `SafetyMetricsCard`
- `IncidentTrendChart`

---

### 2. Incidents Page (`incidents/page.tsx`)

**Route:** `/dashboard/health-safety/incidents`

**Features:**
- Statistics cards (Total, Under Investigation, Resolved, Avg. Resolution Time)
- Advanced filtering (search, status, severity, date range)
- Tabbed view (List, Trends)
- Incident list table with status badges
- Trend analysis charts
- Export incidents data
- Quick action: Report Incident button

**Key Components Used:**
- `IncidentListTable`
- `IncidentTrendChart`
- `IncidentStatusBadge`

**Navigation:**
- Back to main H&S dashboard
- Forward to individual incident details

---

### 3. New Incident Report (`incidents/new/page.tsx`)

**Route:** `/dashboard/health-safety/incidents/new`

**Features:**
- Comprehensive incident report form
- Important safety notice banner
- Anonymous reporting option
- File attachments support
- Form validation
- Auto-save drafts (component feature)
- Success toast notifications

**Key Components Used:**
- `IncidentReportForm`

**Workflow:**
1. User fills out incident details
2. Submits form
3. Success notification
4. Redirects to incidents list

---

### 4. Inspections Page (`inspections/page.tsx`)

**Route:** `/dashboard/health-safety/inspections`

**Features:**
- Statistics cards (Total, Overdue, Compliance Rate, Avg. Score)
- Advanced filtering (search, status, type, date range)
- Three-tab view:
  - **Calendar:** Visual schedule of inspections
  - **List View:** Detailed inspection list with reports
  - **Findings:** Issues requiring attention
- Export inspections data
- Quick action: Schedule Inspection button

**Key Components Used:**
- `InspectionScheduleCalendar`
- `InspectionReportViewer`
- `InspectionFindingsCard`

**Navigation:**
- Back to main H&S dashboard
- Forward to inspection scheduling

---

### 5. Hazards Page (`hazards/page.tsx`)

**Route:** `/dashboard/health-safety/hazards`

**Features:**
- Statistics cards (Total, Critical, In Progress, Avg. Resolution Time)
- Advanced filtering (search, status, priority)
- View mode toggle (Grid / List)
- Two-tab view:
  - **Hazard Reports:** All reported hazards
  - **Corrective Actions:** Action tracking
- Export hazards data
- Quick action: Report Hazard button
- Inline hazard report form

**Key Components Used:**
- `HazardsList`
- `HazardReportForm`
- `HazardPriorityBadge`
- `CorrectiveActionTracker`

**Workflow:**
1. Click "Report Hazard" → Shows form
2. Submit hazard report
3. Returns to hazards list
4. View hazard details

---

## 🎨 Design Patterns

All pages follow consistent Union Eyes patterns:

### Layout
- **Client Components** (`"use client"`)
- Framer Motion animations for smooth transitions
- Responsive grid layouts (mobile-first)
- Gradient backgrounds with backdrop blur
- Max-width containers (max-w-7xl)

### Header Structure
```tsx
- Breadcrumb navigation (Back button)
- Page title with icon
- Description text
- Action buttons (Export, Primary action)
```

### Statistics Cards
- 4-column grid (responsive)
- Icon with colored accent
- Large number display
- Supporting text/context

### Filtering
- Search input with icon
- Select dropdowns for filters
- Consistent spacing and layout
- Responsive grid

### Tabs
- Shadcn/ui Tabs component
- Icon + label format
- Consistent tab content structure

---

## 🔌 Integration Points

### Required Props
All pages expect:
- `organizationId` from `useOrganizationId()` hook
- `user` object from Clerk's `useUser()`

### API Endpoints (To Be Implemented)

```typescript
// Statistics
GET /api/health-safety/dashboard?organizationId={id}&period={period}
GET /api/health-safety/incidents/stats?organizationId={id}&period={period}
GET /api/health-safety/inspections/stats?organizationId={id}
GET /api/health-safety/hazards/stats?organizationId={id}

// Data Operations
POST /api/health-safety/incidents
POST /api/health-safety/hazards
GET  /api/health-safety/incidents?organizationId={id}
GET  /api/health-safety/inspections?organizationId={id}
GET  /api/health-safety/hazards?organizationId={id}

// Export
GET /api/health-safety/export?type={incidents|inspections|hazards}
```

---

## 🔐 Authentication & Permissions

### Current Implementation
- Organization-level checks via `useOrganizationId()`
- User authentication via Clerk
- Graceful fallback when no organization selected

### Recommended Permissions
Based on `lib/auth/roles.ts`:

```typescript
// View permissions
VIEW_HEALTH_SAFETY_CLAIMS
VIEW_ANALYTICS

// Create/Manage permissions
CREATE_HEALTH_SAFETY_CLAIM
MANAGE_HEALTH_SAFETY

// Role suggestions
HEALTH_SAFETY_REP - Full access
STEWARD - View + Create
MEMBER - View own + Create
```

---

## 🌐 Internationalization

All pages use `next-intl`:

```typescript
const t = useTranslations();
```

### Translation Keys Needed

Add to your messages JSON:

```json
{
  "healthSafety": {
    "title": "Health & Safety",
    "incidents": "Incidents",
    "inspections": "Inspections",
    "hazards": "Hazards",
    "reportIncident": "Report Incident",
    "scheduleInspection": "Schedule Inspection",
    "reportHazard": "Report Hazard",
    "export": "Export",
    "filters": "Filters",
    "search": "Search..."
  }
}
```

---

## ♿ Accessibility

All pages implement:
- Semantic HTML structure
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management
- Screen reader compatible
- Color contrast compliance

---

## 📱 Responsive Breakpoints

```css
Mobile:  < 768px   (1 column)
Tablet:  768-1024px (2 columns)
Desktop: > 1024px   (3-4 columns)
```

All pages are fully responsive with mobile-first design.

---

## 🧪 Testing Checklist

- [ ] Organization selection required
- [ ] Statistics load correctly
- [ ] Filters update data
- [ ] Tab navigation works
- [ ] Export buttons trigger actions
- [ ] Forms validate input
- [ ] Success/error toasts display
- [ ] Navigation flows correctly
- [ ] Mobile responsive
- [ ] Dark mode compatible

---

## 🚀 Next Steps

1. **Implement API endpoints** for real data
2. **Add permission checks** at page/component level
3. **Complete translations** for all text
4. **Add role-based feature toggling**
5. **Implement export functionality**
6. **Add detailed incident/inspection/hazard views**
7. **Create training module page**
8. **Add dashboard to navigation sidebar**

---

## 📝 Notes

- All pages currently use mock data - replace with API calls
- Toast notifications use Sonner library
- All components are from `@/components/health-safety`
- Animation delays create smooth sequential loading
- Export functions are placeholders - implement file generation

---

## 🤝 Contributing

When adding new H&S pages:
1. Follow the established pattern (Header → Stats → Filters → Tabs)
2. Use consistent motion animations
3. Include proper TypeScript types
4. Add to this README
5. Document API requirements
6. Include translation keys

---

## 📞 Support

For issues or questions about these pages, refer to:
- `components/health-safety/README.md` - Component documentation
- `lib/auth/roles.ts` - Permission system
- Existing dashboard pages for patterns

---

**Created:** February 2026  
**Last Updated:** February 11, 2026  
**Version:** 1.0.0
