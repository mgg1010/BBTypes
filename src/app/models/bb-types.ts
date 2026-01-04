export type BBTypeBase = 'Core' | 'Basic' | 'List' | 'Struct' | 'Union' | 'Dict' | 'Enum' | null;

export interface IDString {
    id?: string | number;
    text?: string;
    // Compatibility for IDString struct
    Id?: string | number;
    Text?: string;
}

export interface BBSettingDefinition {
    id: string;
    name: string;
    typeId: string; // reference to BBType
    subtypeId?: string; // For parameterized types like List, TypeEditor - specifies the subtype
    description?: string;
    isCustom?: boolean; // True if user-added via customization dialog
    values?: IDString[]; // For Enum/Dropdown types
    defaultValue?: any;

    // Inheritance behavior flags
    mustOverride?: boolean; // If true, new types derived from this MUST copy this setting to their own settings
    noDelete?: boolean;     // If true, user cannot delete this setting override
    mandatory?: boolean;    // If true, user cannot save without a valid value

    // Read/Write and Input/Output flags
    readOnly?: boolean;     // If true, setting is not writeable (display only)
    inputOutput?: number;   // 0 = Input (default), 1 = Output (calculated/derived)
}

export interface BBField {
    Prompt?: string;         // Field label/prompt text
    TypeID: string;          // Reference to another BBType by ID (REQUIRED)
    FieldID: string;         // Unique field identifier (REQUIRED)
    Required?: boolean;      // Whether field is required
    Group?: number;          // Group number for organizing fields
    Description?: string;    // Field description/help text
    settings?: Record<string, any>; // Per-field configuration (e.g. constraints, default editor)

    // Legacy properties (for backward compatibility during migration)
    name?: string;           // @deprecated Use FieldID
    typeId?: string;        // @deprecated Use TypeID
}

export interface BBSettingOverride {
    fieldName: string; // "*" for all or specific name
    settingTypeId?: string; // "*" for global settings or specific type (e.g., "string", "number")
    settingId: string; // e.g. "UI.EditMode"
    value: any;
    isExpression?: boolean;
}

export interface BBEditor {
    id: string;
    name: string;
    type: 'System' | 'Custom';
    baseEditorId?: string;
    publishedSettings: Record<string, 'published' | 'hidden'>; // Map of ID -> status
    settingDefinitions?: BBSettingDefinition[]; // Definitions for settings this editor publishes
    overrides: BBSettingOverride[];
    isHidden?: boolean;
}

export interface BBType {
    id: string; // Unique Identifier (often Name for core types)
    name: string;
    description?: string;
    baseType: BBTypeBase;
    userDefined: boolean;
    isAnonymous?: boolean;
    parentId?: string;

    // New classification system
    source: 'System' | 'Type Defined' | 'User Defined';
    fieldBaseType: boolean; // Can this type be used as a field type?
    sourceType?: string; // For Type Defined types, the type that created this
    isDynamic?: boolean; // For meta-types like BBType and TypeEditor that compute values at runtime
    sortPosition?: number; // Internal sort order for type list (lower = earlier)

    // For Basic types (Enums)
    values?: IDString[];

    // For List types
    subtypeId?: string;

    // For Struct/Union types
    fields?: BBField[];

    // Intrinsic Settings (Type-level constraints)
    settings?: Record<string, any>;
    publishedSettings?: Record<string, 'published' | 'hidden'>;
    settingDefinitions?: BBSettingDefinition[];
    typeOverrides?: BBSettingOverride[]; // Type-level setting overrides (for fields)

    // String
    validationRules?: any[]; // List of String.ValidationRule objects
    maxLen?: number;
    maxLenMsg?: string;
    minLen?: number;
    minLenMsg?: string;

    // Number
    allowNegative?: boolean;
    allowNegativeMsg?: string;
    allowDecimals?: boolean;
    minValue?: number;
    minValueMsg?: string;
    maxValue?: number;
    maxValueMsg?: string;
    allowDecimalsMsg?: string;
    allowScientific?: boolean;
    allowScientificMsg?: string;

    // List
    ordered?: boolean;

    editors: BBEditor[];
}

export interface BBSettingListItem {
    id: string;
    label: string;
    type: 'header' | 'setting'; // 'header' = Scope Header, 'setting' = Actual Setting

    // For Settings
    isComplex?: boolean; // If true, control renders below label row
    component?: string; // 'fields', 'groups', 'editors'

    hidden?: boolean;
    removable?: boolean;

    settingDef?: BBSettingDefinition;
    value?: any;
    scope?: string; // The scope group ID (e.g. 'root', 'field:Name')
    readOnly?: boolean;
}
