# Copilot Instructions for Volunteer Profile Manager

## Project Overview
A Solid-based Next.js application for managing volunteer profiles using Linked Data Objects (LDO). Volunteers authenticate via Solid OIDC and store profile data (locations, availability, skills, causes) in their personal Solid Pods.

## Architecture

### Technology Stack
- **Next.js 15** with App Router and Turbopack
- **@ldo/solid-react** for Solid Pod interactions and RDF data binding
- **SHACL Compact (`.shaclc`)** shapes defining data models → auto-generated TypeScript types
- **Community Solid Server (CSS)** for local development
- **Tailwind CSS 4** for styling

### Data Flow
1. User authenticates via Solid OIDC (`useSolidAuth` hook)
2. Profile URI derived from WebID: `webId.replace(/\/profile\/card#me$/, "/volunteer/profile")`
3. Data loaded via `useResource` + `useSubject` with LDO ShapeTypes
4. Edits committed to Pod via `createData` + `commitData`

### Key Directories
- `src/shapes/` - SHACL Compact shapes (source of truth for data models)
- `src/ldo/` - Auto-generated TypeScript from shapes (**never edit manually**)
- `src/ontology/` - RDF/OWL vocabulary definitions
- `src/components/editor/` - Domain-specific editors (Location, Time, Skills, Causes)

## Development Workflow

### Essential Commands
```bash
npm run build:ldo     # Regenerate LDO types from .shaclc shapes
npm run start:dev     # Start all services: CSS (3001), Next (3000), LDO watch
npm run build         # Full build: LDO then Next
```

### When Modifying Data Models
1. Edit `src/shapes/*.shaclc` files
2. Run `npm run build:ldo` to regenerate `src/ldo/` TypeScript files
3. Update corresponding constants in `ProfileEditor.tsx` (SKILLS, REQUIREMENTS, CAUSES arrays)

### Environment Setup
Copy `.env.example` to `.env` and set:
- `NEXT_PUBLIC_OIDC_ISSUER` - e.g., `https://login.inrupt.com`
- `NEXT_PUBLIC_ADMIN_WEBID` - Your WebID for admin access

## Coding Patterns

### LDO Data Access Pattern
```tsx
// Load resource and bind to shape
const profileResource = useResource(profileUri);
const profile = useSubject(VolunteerProfileShapeType, profileUri);

// Create/update data
const updatedProfile = createData(VolunteerProfileShapeType, profileUri, profileResource);
updatedProfile.hasSkill?.add({ "@id": skillId });
await commitData(updatedProfile);
```

### Client Components with Solid
All components using `@ldo/solid-react` hooks must be client components:
```tsx
"use client";
import { useSolidAuth, useLdo, useSubject, useResource } from "@ldo/solid-react";
```

### Leaflet Maps (SSR Handling)
Dynamically import to avoid SSR issues:
```tsx
const LocationMap = dynamic(() => import("./LocationMap"), { ssr: false });
```

### RDF Value References
Skills, requirements, and causes use full namespace URIs from `https://id.volunteeringdata.io/schema/`:
```tsx
// ID format in code
{ id: "EmpathyAndCompassion", label: "..." }
// Stored as: https://id.volunteeringdata.io/schema/EmpathyAndCompassion
```

Days use W3C Time Ontology URIs: `http://www.w3.org/2006/time#Monday`

## Project-Specific Conventions

### Auth Flow
- `AuthWrapper` handles OAuth callback detection and session restoration
- Login redirects to `/login`, authenticated users redirect to `/`
- Session state checked via `localStorage` keys containing "solidClientAuthn"

### Profile URI Convention
Volunteer profiles stored at: `{pod-root}/volunteer/profile` (not in WebID document)

### Access Control
Uses ACP (Access Control Policy), not WAC. See `.data/.acr` for local server config.

## Testing with Playwright

### Testing Requirements
- **Every new feature must include Playwright tests**
- Tests must use the local CSS instance (`http://localhost:3001`) for authentication
- Tests must verify data persistence across logout/login cycles

### Test Pattern: Persistence Verification
All feature tests should follow this pattern:
```typescript
test('feature data persists after logout/login', async ({ page }) => {
  // 1. Login to local CSS
  await loginToLocalCSS(page);
  
  // 2. Make changes (e.g., set availability)
  await page.getByRole('tab', { name: 'Availability' }).click();
  await page.getByLabel('Monday').check();
  await page.getByRole('button', { name: 'Save' }).click();
  
  // 3. Logout
  await logout(page);
  
  // 4. Login again
  await loginToLocalCSS(page);
  
  // 5. Verify data is pre-populated correctly
  await page.getByRole('tab', { name: 'Availability' }).click();
  await expect(page.getByLabel('Monday')).toBeChecked();
});
```

### Local CSS Authentication
Tests authenticate against `http://localhost:3001` (Community Solid Server):
- Ensure `npm run start:dev` is running before tests
- Local CSS stores data in `./data/` directory
- Reset `./data/` between test runs for clean state if needed

### Running Tests
```bash
npm run test:e2e        # Run all Playwright tests
npm run test:e2e:ui     # Run with Playwright UI
```

## Development Notes
- Local Solid server runs on port 3001, Next.js on port 3000
- Reset `.data/.acr` to make local server accessible to everyone during development
