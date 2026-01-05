# Horizontal Editor Flickering - RESOLVED

## Final Solution Summary

### Root Cause
The horizontal editor was being destroyed and recreated continuously because `dynamic-field.component.ts` was calling `loadComponent()` whenever the `settings` input reference changed, even when the actual setting values were identical. This happened on every change detection cycle due to parent components creating new settings objects.

### The Fix (Primary)
**File**: `src/app/shared/dynamic-field.component.ts`

**Changes**:
1. Added tracking variables for previous input values
2. Implemented smart change detection in `ngOnChanges`:
   - Only reloads component when inputs **materially** change (value comparison)
   - Not just when references change (reference comparison)
3. Created `hasSettingsChanged()` method to check critical settings  
4. Stores previous values after each load for next comparison

**Key Code**:
```typescript
// Only reload if critical inputs actually changed (not just reference changes)
const needsReload = 
    (changes['typeId'] && this.typeId !== this.previousTypeId) ||
    (changes['subtypeId'] && this.subtypeId !== this.previousSubtypeId) ||
    (changes['editorId'] && this.editorId !== this.previousEditorId) ||
    (changes['mode'] && this.mode !== this.previousMode) ||
    (changes['size'] && this.size !== this.previousSize) ||
    (changes['settings'] && this.hasSettingsChanged(changes['settings'].previousValue, this.settings));
```

### Supporting Fixes

These were implemented during investigation and provide performance improvements:

#### 1. Runtime Override Array Caching
**Files**: 
- `src/app/bb-types/bb-type-builder.component.ts`
- `src/app/shared/list-editor.component.ts`

**Problem**: Methods were creating new arrays on every call, causing Angular to detect changes
**Solution**: Store arrays as readonly class properties, return same reference every time

#### 2. Width Calculation Caching  
**File**: `src/app/shared/struct-horizontal-editor.component.ts`

**Changes**:
- Pre-compute header cell styles in `headerCells` array
- Cache width calculations in `fieldWidthCache` Map
- Eliminates method calls from template (performance improvement)

#### 3. Header Styling
**Files**:
- `src/app/shared/struct-horizontal-editor.component.ts`
- `src/app/shared/list-editor.component.ts`

**Changes**:
- Height: 15px
- Overflow: visible  
- No background, no border
- Proper spacing and alignment

### Other Fixes
- Fixed TypeEditor case mismatch in `add-setting-dialog.component.ts`
- Fixed Number.MaxValue check in `layout-helpers.ts`

## Performance Impact

**Before**:
- Component destroyed/recreated ~100 times per second on mouse movement
- Continuous console spam: "HorzEdit DESTROY" / "HorzEdit INIT"
- Headers invisible/flickering
- High CPU usage

**After**:
- Component stable, no unnecessary recreations  
- No console spam
- Headers visible and stable
- Normal CPU usage

## Testing
To verify the fix:
1. Open browser console
2. Navigate to Fields or Editors list  
3. Move mouse over the list
4. Should see NO "HorzEdit INIT/DESTROY" messages
5. Headers should remain visible and stable

## Lessons Learned

1. **Change Detection**: Always compare actual values, not just references, especially for objects/arrays passed as @Input
2. **OnPush Strategy**: Helps but doesn't solve reference-change issues in parent components
3. **Debug Logging**: Critical for identifying recreate cycles
4. **Root Cause Analysis**: The fix wasn't in the flickering component itself, but in its parent's change detection logic

## Files Modified

### Critical Fix:
- `src/app/shared/dynamic-field.component.ts` - Smart change detection

### Performance Improvements:
- `src/app/bb-types/bb-type-builder.component.ts` - Array caching
- `src/app/shared/list-editor.component.ts` - Array caching  
- `src/app/shared/struct-horizontal-editor.component.ts` - Width caching, styling

### Minor Fixes:
- `src/app/bb-types/dialogs/add-setting-dialog.component.ts` - TypeEditor case
- `src/app/bb-types/layout-helpers.ts` - Number.MaxValue logic

## Commit Status
✅ Committed and pushed to origin/master
