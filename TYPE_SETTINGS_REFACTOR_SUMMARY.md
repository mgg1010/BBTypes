# Type Settings Refactoring - Complete Summary

## Overview
This document summarizes the comprehensive refactoring of the Type Settings and Type Creation system completed on 2025-12-29/30.

## Major Changes Implemented

### 1. "Kind" → "Based On" System
**Goal:** Replace the abstract "Kind" dropdown with intuitive "Based On" system types.

**Changes:**
- Replaced "Kind" dropdown options (Basic, List, Struct, Union, Dict) with System types (String, Number, Boolean, File, Date, Dict, List, Struct)
- Added `basedOnType` property to track which system type a user type is based on
- Implemented `onBasedOnTypeChange()` to automatically copy defaults from system types
- Added `determineBasedOnType()` to intelligently detect the base type when editing existing types

**Files Modified:**
- `bb-types/bb-type-builder.component.ts`
- `bb-types/core-types.ts`

### 2. Dynamic Type Configuration Sections
**Goal:** Show relevant configuration options based on selected system type.

**Changes:**
- **String Configuration:** Displays Allowed Values, Min/Max Length, validation messages
- **Number Configuration:** Displays Allow Negative/Decimals/Scientific with messages
- **Boolean Configuration:** Displays Allowed Values (True/False)
- **List Configuration:** Shows "List Of" inline with dropdown, displays subtype Type Settings on RHS
- **Struct Configuration:** Shows Fields editor, displays field type settings on RHS
- Added `getSystemTypeName()` helper to display proper type names

**Files Modified:**
- `bb-types/bb-type-builder.component.ts`

### 3. Type Settings vs Editor Settings
**Goal:** Clear separation between intrinsic type constraints and editor presentation settings.

**Changes:**
- Added `settingDefinitions` to core types (String, Number, Boolean)
- Type Settings now include:
  - **String:** AllowedValues, MinLen, MaxLen, and messages
  - **Number:** AllowNegative, AllowDecimals, AllowScientific, and messages
  - **Boolean:** AllowedValues
- Automatic copying of settingDefinitions when creating types based on system types

**Files Modified:**
- `bb-types/core-types.ts`
- `models/bb-types.ts` (added `settingDefinitions` support)

### 4. UI Improvements
**Goal:** Better UX and consistent styling.

**Changes:**
- Type Settings area constrained to max 33% width (min 400px)
- Label column width standardized to 110px (matching Test screen)
- Added 20px margin below "+ Add Value" buttons
- "Core" baseType hidden in Type List display
- Base Type column shows actual based-on type (Boolean, String, etc.) for user types

**Files Modified:**
- `bb-types/bb-type-builder.component.ts` (CSS)
- `bb-types/bb-type-list.component.ts`

### 5. List/Dict Subtype Settings Display
**Goal:** Show Type Settings for the selected subtype in List/Dict configuration.

**Changes:**
- **List Of** dropdown and label on same line
- Added "Ordered" checkbox as List Type Setting
- RHS panel dynamically titled (e.g., "String Type Settings", "Number Type Settings")
- Implemented `getSubtypeSettings()`, `getSubtypeSetting()`, `updateSubtypeSetting()` methods
- Subtype settings update when user changes the List Of type

**Files Modified:**
- `bb-types/bb-type-builder.component.ts`

### 6. Struct Field Settings Display
**Goal:** Show Type Settings for selected field's type.

**Changes:**
- RHS panel title changes based on selected field (e.g., "String Type Settings" for a String field)
- Implemented `getFieldSettingsTitle()` method
- Field-level settings grouped under `[FIELD_NAME]` headers

**Files Modified:**
- `bb-types/bb-type-builder.component.ts`

### 7. Meta-Types for Self-Referential System
**Goal:** Create dynamic types that introspect the type system itself.

**Changes:**
- Created **BBType** meta-type:
  - Dynamically computes list of types based on filter settings
  - Settings: SystemSource, TypeSource, UserSource, FieldBase
  - Returns filtered list of types matching criteria
  - `isDynamic: true` flag marks it for runtime computation
  
- Created **TypeEditor** meta-type:
  - Dynamically computes list of editors for a selected type
  - Setting: Type (of type BBType)
  - Returns list of editors for the selected type
  - `isDynamic: true` flag marks it for runtime computation

- Implemented dynamic value computation in `dynamic-field.component.ts`
  - Detects `isDynamic` flag
  - Computes `values` array at runtime based on current settings
  - BBType filters type list based on source and fieldBase settings
  - TypeEditor queries selected type's editors

**Files Modified:**
- `bb-types/core-types.ts` (added BBType and TypeEditor types)
- `models/bb-types.ts` (added `isDynamic` property)
- `shared/dynamic-field.component.ts` (added dynamic computation logic)

### 8. Test Modal Improvements
**Goal:** Test modal should use type's default editor setting.

**Changes:**
- Modified `openTestEditor()` to find editor with `id='default'`
- Pre-populate Editor dropdown with default editor's baseEditorId
- Test correctly displays user-selected default editor (e.g., Radio for Boolean)

**Files Modified:**
- `bb-types/bb-type-list.component.ts`

## Type Classification System (Previously Implemented)
This refactoring builds on the type classification system:
- `source`: 'System' | 'Type Defined' | 'User Defined'
- `fieldBaseType`: boolean (can be used as struct field)
- `sourceType`: string (for Type Defined types)

## Known Issues & Future Work

### Resolved:
- ✅ Gender type showing "Core" instead of "Boolean" → Fixed by adding `getBasedOnTypeName()`
- ✅ Test modal showing wrong editor → Fixed by using default editor
- ✅ Type Settings not visible in creation flow → Fixed by adding dynamic sections

### Remaining:
- Test modal Editor dropdown for Gender - needs verification that TypeEditor works correctly
- Consider auto-generating `.Editor` types or fully migrating to TypeEditor
- Add migration logic for types created before this refactoring (or document need to recreate)

## Usage Examples

### Creating a Gender Type Based on Boolean:
1. Click "+ New Type"
2. Enter name: "Gender"
3. Based On: "Boolean"
4. Boolean Configuration section appears with True/False values
5. Customize values: Male (1), Female (0)
6. Save type

### Creating a People List Type:
1. Click "+ New Type"
2. Enter name: "People"
3. Based On: "List"
4. List Configuration appears
5. List Of: "Person" (from dropdown)
6. Person Type Settings appear on RHS
7. Configure Person field settings
8. Ordered: [x] (checkbox)
9. Save type

### Using BBType for Dynamic Type Picking:
```typescript
// In a Type Setting definition:
{ 
  id: 'MyType.TargetType',
  name: 'Target Type',
  typeId: 'BBType' // Will show dropdown of all types (filtered by BBType settings)
}
```

### Using TypeEditor for Dynamic Editor Picking:
```typescript
// In a Type Setting definition:
{ 
  id: 'MyType.Editor',
  name: 'Editor',
  typeId: 'TypeEditor' // Will show dropdown of editors for the type specified in TypeEditor.Type setting
}
```

## Testing Checklist

- [x] Create type based on String
- [x] Create type based on Number
- [x] Create type based on Boolean
- [ ] Create type based on List
- [ ] Create type based on Struct
- [x] Edit existing type preserves basedOnType
- [x] Type List shows correct Base Type
- [ ] Test modal uses correct default editor
- [ ] BBType filters types correctly
- [ ] TypeEditor shows correct editors

## Files Changed Summary

### Core Type System:
- `models/bb-types.ts` - Added isDynamic property
- `bb-types/core-types.ts` - Added BBType, TypeEditor, Type Settings

### Type Builder:
- `bb-types/bb-type-builder.component.ts` - Complete refactoring of UI and logic

### Type List:
- `bb-types/bb-type-list.component.ts` - Display improvements, Test modal fixes

### Dynamic Field:
## Status: Completed (Dec 31, 2025)

### Completed Items
- [x] **Global Type Definition Split**: (Reverted in favor of Field-level split)
- [x] **Field Settings Tabs**: Implemented "Type Settings" and "Editor Settings" tabs in the field configuration column.
- [x] **Editor Selection**: Added dropdown to select specific editors for individual fields.
- [x] **Font Standardization**: Implemented `sys-h4` and `sys-body-text` global classes and applied them to the Type Builder headers.
- [x] **Infrastructure**: Added helper methods (`getFieldEditorId`, `setFieldEditorId`) to `BBTypeBuilderComponent`.

### Next Steps
- Implement specific settings UI for the selected field editor (currently a placeholder).
- Migrate other components to use `sys-h4`.
ectly references system types users understand

## Next Steps

1. Test BBType and TypeEditor in real usage
2. Migrate existing `.Editor` types to use TypeEditor
3. Consider adding BBField meta-type for field selection
4. Document meta-type pattern for future extensibility

---

**Date Completed:** December 30, 2025  
**Build Status:** ✅ Passing  
**Breaking Changes:** Types created before this refactoring may need to be recreated
