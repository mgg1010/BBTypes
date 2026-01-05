# Horizontal Editor Flickering Investigation

## Current Status (2026-01-05)

### Problem Summary
The horizontal editor component is being **destroyed and recreated continuously** on mouse movement, causing:
1. Headers to disappear during mouse movement
2. Constant re-rendering
3. Poor performance

### Root Causes Identified

1. **Component Recreation Cycle**
   - Console shows: `HorzEdit DESTROY` → `HorzEdit INIT` repeating
   - The `dynamic-editor` component calls `viewContainerRef.clear()` when `componentType` changes
   - This destroys the child component completely

2. **Headers Not Showing (showHeaders: false)**
   - Console log shows `showHeaders: false` on INIT
   - Runtime overrides setting `List.CoreEdit.ShowHeaders: true` aren't being applied
   - The setting key might be wrong or not reaching the horizontal editor

3. **Possible Triggers**
   - Mouse movement triggering change detection
   - Parent component (dynamic-field or list-editor) re-rendering
   - `componentType` reference changing on each render

### Fixes Applied So Far

✅ **Array Caching** - Fixed runtime override arrays creating new references:
   - `bb-type-builder.component.ts`: Cached HORIZONTAL_EDITOR_OVERRIDES
   - `list-editor.component.ts`: Cached HEADER_OVERRIDES and HIDE_HEADERS_OVERRIDE

✅ **Width Calculation Caching** - Prevented continuous recalculation:
   - Added `fieldWidthCache` Map
   - Pre-computed `headerCells` array with styles

### Outstanding Issues

❌ **Component Destruction**:
   - Need to prevent `componentType` from changing on every render
   - OR need to make `dynamic-editor` smarter about when to reload

❌ **showHeaders Not Working**:
   - Runtime override `List.CoreEdit.ShowHeaders: true` not reaching component
   - Actual setting being read is `Struct.HorzEdit.ShowHeaders`
   - **MISMATCH**: Setting 'List.CoreEdit.ShowHeaders' but reading 'Struct.HorzEdit.ShowHeaders'

## Recommended Next Steps

### Priority 1: Fix showHeaders Setting Mismatch
The runtime override sets `List.CoreEdit.ShowHeaders` but the component reads `Struct.HorzEdit.ShowHeaders`.

**Option A**: Change runtime override to use correct key:
```typescript
{ fieldName: '*', settingId: 'Struct.HorzEdit.ShowHeaders', value: true }
```

**Option B**: Change component to read List.CoreEdit.ShowHeaders:
```typescript
this.showHeaders = !!this.settings['List.CoreEdit.ShowHeaders'];
```

### Priority 2: Stop Component Recreation
**Option A - Cache componentType**: 
- Store resolved component types in a Map
- Return same reference for same editorId

**Option B - Smarter dynamic-editor**:
- Don't call `loadComponent()` if componentType is same reference
- Add equality check before clearing container

**Option C - Disable mouse-triggered change detection**:
- Use `ChangeDetectorRef.detach()` strategically
- Only run change detection on actual data changes

## Code Locations

- **Horizontal Editor**: `src/app/shared/struct-horizontal-editor.component.ts`
- **Dynamic Editor** (destroys/creates): `src/app/shared/dynamic-editor.component.ts` Line 52
- **List Editor** (runtime overrides): `src/app/shared/list-editor.component.ts` Lines 340-365
- **Type Builder** (runtime overrides): `src/app/bb-types/bb-type-builder.component.ts` Lines 545-550

## Testing Notes

To test if fix works:
1. Open browser console
2. Look for "HorzEdit INIT" messages
3. Move mouse over the Fields/Editors list
4. If INIT/DESTROY stop appearing → component recreation fixed
5. If `showHeaders: true` appears → settings fixed
