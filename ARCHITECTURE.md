# Architecture Guide

## Overview

The Shop POS System is built using a modern, layered architecture that separates concerns and maintains clean code boundaries.

## Architecture Layers

### 1. Presentation Layer (UI Components)
Located in `/src/components/` and `/src/pages/`

**Responsibilities:**
- Render user interface
- Handle user interactions
- Display data to users
- Manage local component state

**Components:**
- **Layout Components**: `AppLayout.tsx`, `Sidebar.tsx`
- **Page Components**: `PosPage.tsx`, `ProductsPage.tsx`, `SalesPage.tsx`, `SettingsPage.tsx`
- **Reusable UI**: Components in `/src/components/ui/`
- **Feature Components**: POS-specific components in `/src/components/pos/`

### 2. State Management Layer
Located in `/src/context/`

**Responsibilities:**
- Manage application state
- Provide data to components
- Handle state transitions

**Key Contexts:**
- **CartContext**: Manages shopping cart state and operations
  - Items in cart
  - Discount calculations
  - Cart totals
  - Add/remove/update operations

### 3. Business Logic Layer
Located in `/src/lib/`

**Responsibilities:**
- Currency formatting and calculations
- Data transformation
- Business rule implementation
- Utility functions

**Key Utilities:**
- Currency functions (roundMoney, formatting)
- Data helpers
- Validation functions

### 4. Data Layer
Located in `src-tauri/`

**Responsibilities:**
- Database operations
- Data persistence
- API endpoints
- Tauri commands

**Technology:**
- SQLite for local storage
- Tauri for backend

### 5. Type System
Located in `/src/types/`

**Responsibilities:**
- Define data structures
- Maintain type safety
- Enable IDE support

**Key Types:**
- Product
- CartItem
- Sale
- Category

## Data Flow

```
User Interaction
    ↓
Component Event Handler
    ↓
Context Action/Dispatch
    ↓
State Update
    ↓
Component Re-render
    ↓
Updated UI
```

### Example: Adding Item to Cart

1. User clicks "Add to Cart" button in POS component
2. Component calls `addItem()` from `CartContext`
3. CartContext updates items state
4. Component re-renders with updated cart
5. Total calculations update via useMemo hooks

## Component Hierarchy

```
App
├── BrowserRouter
│   └── CartProvider
│       └── Routes
│           └── AppLayout
│               ├── Sidebar
│               │   └── Navigation
│               └── Route Components
│                   ├── PosPage
│                   ├── ProductsPage
│                   ├── SalesPage
│                   └── SettingsPage
```

## Context Usage

### CartContext
Manages all shopping cart operations and state.

```typescript
import { useCart } from '@context/CartContext';

function MyComponent() {
  const { items, total, addItem, removeItem } = useCart();
  
  return (
    // Component JSX
  );
}
```

## Best Practices

### 1. Component Organization
- Keep components small and focused
- One component per file
- Co-locate related components
- Use index files for exports

### 2. State Management
- Use Context for global state
- Use useState for local state
- Avoid prop drilling
- Keep state as close as possible to where it's used

### 3. Performance
- Use React.memo for expensive components
- Use useCallback for event handlers
- Use useMemo for calculations
- Lazy load routes

### 4. Type Safety
- Always add type annotations
- Avoid `any` types
- Create reusable types
- Use discriminated unions for complex types

### 5. Error Handling
- Use ErrorBoundary for component errors
- Handle async errors with try/catch
- Show user-friendly error messages
- Log errors for debugging

## Tauri Integration

Tauri provides the desktop framework and backend API.

### Key Tauri Features Used:
- Rust backend for file system operations
- Database management
- System integration
- Window management

### Communication:
- Frontend calls Tauri commands
- Tauri commands handle business logic
- Results returned to frontend
- Errors handled gracefully

## State Management Strategy

### Global State (CartContext)
- Shopping cart items
- Discount values
- Calculated totals

### Local State (useState)
- Form inputs
- UI toggles
- Temporary data

### Server State
- Products (fetched from backend)
- Sales history
- Settings

## Database Schema Overview

The SQLite database contains:
- Products table with pricing and stock
- Categories for product organization
- Sales transactions
- Sales line items
- Settings

## Security Considerations

### Frontend
- Input validation
- XSS prevention
- Type safety with TypeScript

### Backend (Tauri/Rust)
- SQL injection prevention with parameterized queries
- File system access control
- Command validation

### Data
- Local storage only
- No external API calls
- Encrypted sensitive data if needed

## Testing Strategy

### Unit Tests
- Utility functions
- Custom hooks
- Context logic

### Integration Tests
- Component interactions
- Data flow
- Context updates

### E2E Tests (Future)
- Full user workflows
- Complete transactions

## Performance Optimization

### Current Optimizations
- Code splitting via Vite
- Lazy loading routes
- Memoization of expensive components
- CSS code splitting

### Future Opportunities
- Virtual scrolling for long lists
- Pagination
- Caching strategies
- Database indexing

## Scalability Considerations

### Current Approach
- Works for single-location shops
- Local SQLite database
- In-memory state management

### Future Scaling
- Multi-location support
- Cloud synchronization
- Distributed database
- Advanced analytics

## Development Workflow

1. **Feature Planning**: Define requirements
2. **Type Definition**: Create/update types
3. **Component Creation**: Build UI components
4. **State Management**: Add context/state
5. **Business Logic**: Implement calculations
6. **Testing**: Add unit tests
7. **Integration**: Connect components
8. **Polish**: Styling and UX improvements

## Common Patterns

### Custom Hooks
Create custom hooks for reusable logic:
```typescript
export function useFormState<T>(initial: T) {
  const [data, setData] = useState(initial);
  // ... logic
  return { data, setData };
}
```

### Compound Components
Build flexible component APIs:
```typescript
<Modal>
  <Modal.Header>Title</Modal.Header>
  <Modal.Body>Content</Modal.Body>
  <Modal.Footer>Actions</Modal.Footer>
</Modal>
```

### Context Hooks
Provide convenient access to context:
```typescript
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be in CartProvider');
  return context;
}
```

---

For more information, see the [README](./README.md) and [Contributing Guide](./CONTRIBUTING.md).
