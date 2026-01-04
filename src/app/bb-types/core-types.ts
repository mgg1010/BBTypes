import { BBType, BBSettingDefinition } from '../models/bb-types';

// Helper: Get global editor settings that all editors should have
function getGlobalEditorSettings(): BBSettingDefinition[] {
    return [
        { id: 'Editor.ReadOnly', name: 'Read Only', typeId: 'Boolean', description: 'Make this editor read-only' },
        { id: 'Editor.Locale', name: 'Locale', typeId: 'String', description: 'Locale for this editor (e.g., en-US)' },
        { id: 'Editor.StdFont', name: 'Standard Font', typeId: 'Font', description: 'Font used for standard text' }, // typeId 'Font' matches the Font type
        { id: 'Editor.StdFontSize', name: 'Standard Font Size', typeId: 'Number', description: 'Font size (in pixels) for standard text' },
        { id: 'Editor.ControlMinWidth', name: 'Control Min Width', typeId: 'Number', description: 'Calculated minimum width in pixels', defaultValue: 0, inputOutput: 1 },
        { id: 'Editor.ControlMaxWidth', name: 'Control Max Width', typeId: 'Number', description: 'Calculated maximum width in pixels', defaultValue: 1000, inputOutput: 1 }
    ];
}

// Helper: Get Type.Editor setting for a specific type
// Uses TypeEditor meta-type parameterized with the parent type (like List of String)
function getTypeEditorSetting(typeName: string): BBSettingDefinition {
    return {
        id: 'Type.Editor',
        name: 'Editor',
        typeId: 'TypeEditor', // Updated to TitleCase
        subtypeId: typeName,  // Parameterizes TypeEditor to show this type's editors
        description: `Select which editor to use for ${typeName} fields`
    };
}

// Helper: Get Type.Kind setting for a type
// Returns read-only enum setting indicating if type is System (0), TypeDefined (1), or User (2)
function getTypeKindSetting(kind: '0' | '1' | '2' = '0'): BBSettingDefinition {
    return {
        id: 'Type.Kind',
        name: 'Type Kind',
        typeId: 'Enum',
        values: [
            { id: '0', text: 'System' },
            { id: '1', text: 'TypeDefined' },
            { id: '2', text: 'User' }
        ],
        readOnly: true,
        defaultValue: kind
    };
}

export const INITIAL_CORE_TYPES: BBType[] = [
    // --- Primitives / Core Types ---
    {
        id: 'String',
        name: 'String',
        description: 'The base string type, can be configured with min, max size and value list',
        baseType: null,
        userDefined: false,
        source: 'System',
        fieldBaseType: true,
        // Intrinsic fields
        validationRules: [],
        maxLen: 100000,
        maxLenMsg: 'Must be %d characters or less',
        minLen: 0,
        minLenMsg: 'Must be %d characters or more',
        settingDefinitions: [
            getTypeKindSetting('0'),
            { id: 'String.MinLen', name: 'Min Length', typeId: 'Number' },
            { id: 'String.MinLenMsg', name: 'Min Length Message', typeId: 'String' },
            { id: 'String.MaxLen', name: 'Max Length', typeId: 'Number' },
            { id: 'String.MaxLenMsg', name: 'Max Length Message', typeId: 'String' },
            { id: 'Type.Editors', name: 'Editors', typeId: 'List', subtypeId: 'BBEditor', mustOverride: true, noDelete: true }
        ],
        settings: {
            'Type.Kind': '0',
            'Type.Editor': 'StringEdit'
        },
        editors: [{
            id: 'StringEdit',
            name: 'Core String Editor',
            type: 'System',
            baseEditorId: 'String',
            publishedSettings: {
                'Type.Editor': 'published',
                'String.UpperCase': 'published',
                'String.MaxLen': 'published',
                'String.MaxLenMsg': 'published',
                'String.MinLen': 'published',
                'String.MinLenMsg': 'published',
                'String.ValidationRules': 'published',
                'Editor.ReadOnly': 'published',
                'Editor.Locale': 'published',
                'Editor.StdFont': 'published',
                'Editor.StdFontSize': 'published'
            },
            settingDefinitions: [
                getTypeEditorSetting('String'),
                ...getGlobalEditorSettings(),
                { id: 'String.UpperCase', name: 'Upper Case', typeId: 'Boolean' },
                { id: 'String.MaxLen', name: 'Max Length', typeId: 'Number' },
                { id: 'String.MaxLenMsg', name: 'Max Length Msg', typeId: 'String' },
                { id: 'String.MinLen', name: 'Min Length', typeId: 'Number' },
                { id: 'String.MinLenMsg', name: 'Min Length Msg', typeId: 'String' },
                { id: 'String.ValidationRules', name: 'Validation Rules', typeId: 'String.ValidationRules' }
            ],
            overrides: []
        }]
    },
    {
        id: 'Number',
        name: 'Number',
        description: 'The base number type, can be configured to be int, float etc',
        baseType: null,
        userDefined: false,
        source: 'System',
        fieldBaseType: true,
        // Intrinsic fields
        allowNegative: true,
        allowNegativeMsg: 'Number cannot be negative',
        allowDecimals: true,
        allowDecimalsMsg: 'Number cannot be a decimal',
        allowScientific: false,
        allowScientificMsg: 'Number cannot use scientific notation',

        // Type Settings
        settingDefinitions: [
            getTypeKindSetting('0'),
            { id: 'Number.AllowNegative', name: 'Allow Negative', typeId: 'Boolean' },
            { id: 'Number.AllowNegativeMsg', name: 'Allow Negative Message', typeId: 'String' },
            { id: 'Number.AllowDecimals', name: 'Allow Decimals', typeId: 'Boolean' },
            { id: 'Number.AllowDecimalsMsg', name: 'Allow Decimals Message', typeId: 'String' },
            { id: 'Number.AllowScientific', name: 'Allow Scientific', typeId: 'Boolean' },
            { id: 'Number.AllowScientificMsg', name: 'Allow Scientific Message', typeId: 'String' },
            { id: 'Number.MinValueEnabled', name: 'Min Value Enabled', typeId: 'Boolean' },
            { id: 'Number.MinValue', name: 'Min Value', typeId: 'Number' },
            { id: 'Number.MinValueMsg', name: 'Min Value Msg', typeId: 'String', defaultValue: 'Value must be %d or more' },
            { id: 'Number.MaxValueEnabled', name: 'Max Value Enabled', typeId: 'Boolean' },
            { id: 'Number.MaxValue', name: 'Max Value', typeId: 'Number' },
            { id: 'Number.MaxValueMsg', name: 'Max Value Msg', typeId: 'String', defaultValue: 'Value must be %d or less' },
            { id: 'Type.Editors', name: 'Editors', typeId: 'List', subtypeId: 'BBEditor', mustOverride: true, noDelete: true }
        ],
        settings: {
            'Type.Kind': '0',
            'Type.Editor': 'NumberEdit'
        },
        editors: [{
            id: 'NumberEdit',
            name: 'Core Number Editor',
            type: 'System',
            baseEditorId: 'Number',
            publishedSettings: {
                'Type.Editor': 'published',
                'Number.AllowNegative': 'published',
                'Number.AllowNegativeMsg': 'published',
                'Number.AllowDecimals': 'published',
                'Number.AllowDecimalsMsg': 'published',
                'Number.AllowScientific': 'published',
                'Number.AllowScientificMsg': 'published',
                'Number.MinValueEnabled': 'published',
                'Number.MinValue': 'published',
                'Number.MinValueMsg': 'published',
                'Number.MaxValueEnabled': 'published',
                'Number.MaxValue': 'published',
                'Number.MaxValueMsg': 'published',
                'Editor.ControlMinWidth': 'published',
                'Editor.ControlMaxWidth': 'published',
                'Editor.ReadOnly': 'published',
                'Editor.Locale': 'published',
                'Editor.StdFont': 'published',
                'Editor.StdFontSize': 'published'
            },
            settingDefinitions: [
                getTypeEditorSetting('Number'),
                ...getGlobalEditorSettings(),
                { id: 'Number.AllowNegative', name: 'Allow Negative', typeId: 'Boolean' },
                { id: 'Number.AllowNegativeMsg', name: 'Allow Negative Msg', typeId: 'String' },
                { id: 'Number.AllowDecimals', name: 'Allow Decimals', typeId: 'Boolean' },
                { id: 'Number.AllowDecimalsMsg', name: 'Allow Decimals Msg', typeId: 'String' },
                { id: 'Number.AllowScientific', name: 'Allow Scientific', typeId: 'Boolean' },
                { id: 'Number.AllowScientificMsg', name: 'Allow Scientific Msg', typeId: 'String' },
                { id: 'Number.MinValueEnabled', name: 'Min Value Enabled', typeId: 'Boolean' },
                { id: 'Number.MinValue', name: 'Min Value', typeId: 'Number' },
                { id: 'Number.MinValueMsg', name: 'Min Value Msg', typeId: 'String' },
                { id: 'Number.MaxValueEnabled', name: 'Max Value Enabled', typeId: 'Boolean' },
                { id: 'Number.MaxValue', name: 'Max Value', typeId: 'Number' },
                { id: 'Number.MaxValueMsg', name: 'Max Value Msg', typeId: 'String' }
            ],
            overrides: []
        }]
    },
    {
        id: 'Boolean',
        name: 'Boolean',
        description: 'The base true / false type – based on Enum with 0:False and 1:True options.  Has three standard editors:  Checkbox, Radio, Dropdown',
        baseType: 'Enum',
        userDefined: false,
        source: 'System',
        fieldBaseType: true,
        values: [
            { Id: 0, Text: 'False' },
            { Id: 1, Text: 'True' }
        ],
        settingDefinitions: [
            getTypeKindSetting('0'),
            { id: 'Enum.Options', name: 'Options', typeId: 'List', subtypeId: 'IDString' },
            { id: 'Type.Editors', name: 'Editors', typeId: 'List', subtypeId: 'BBEditor', mustOverride: true, noDelete: true }
        ],
        settings: {
            'Type.Kind': '0',
            'Type.Editor': 'BoolCheckBox'
        },
        editors: [
            {
                id: 'BoolCheckBox',
                name: 'Checkbox Boolean Editor',
                type: 'System',
                baseEditorId: 'checkbox',
                publishedSettings: { 'Type.Editor': 'published', 'Editor.ReadOnly': 'published', 'Editor.Locale': 'published', 'Editor.StdFont': 'published', 'Editor.StdFontSize': 'published' },
                settingDefinitions: [
                    getTypeEditorSetting('Boolean'),
                    ...getGlobalEditorSettings()
                ],
                overrides: []
            },
            {
                id: 'BoolRadio',
                name: 'Radio Boolean Editor',
                type: 'System',
                baseEditorId: 'radio',
                publishedSettings: { 'Type.Editor': 'published', 'Editor.ReadOnly': 'published', 'Editor.Locale': 'published', 'Editor.StdFont': 'published', 'Editor.StdFontSize': 'published' },
                settingDefinitions: [
                    getTypeEditorSetting('Boolean'),
                    ...getGlobalEditorSettings()
                ],
                overrides: []
            },
            {
                id: 'BoolDrop',
                name: 'Dropdown Boolean Editor',
                type: 'System',
                baseEditorId: 'Enum', // Reuses standard enum editor
                publishedSettings: { 'Type.Editor': 'published', 'Editor.ReadOnly': 'published', 'Editor.Locale': 'published', 'Editor.StdFont': 'published', 'Editor.StdFontSize': 'published' },
                settingDefinitions: [
                    getTypeEditorSetting('Boolean'),
                    ...getGlobalEditorSettings()
                ],
                overrides: []
            }
        ]
    },
    {
        id: 'Date',
        name: 'Date',
        description: 'The base date type – holds a standard date, with editors to allow date picking',
        baseType: null,
        userDefined: false,
        source: 'System',
        fieldBaseType: true,
        settingDefinitions: [
            getTypeKindSetting('0'),
            { id: 'Type.Editors', name: 'Editors', typeId: 'List', subtypeId: 'BBEditor', mustOverride: true, noDelete: true }
        ],
        settings: {
            'Type.Kind': '0',
            'Type.Editor': 'DateEdit'
        },
        editors: [{
            id: 'DateEdit',
            name: 'Core Date Editor',
            type: 'System',
            baseEditorId: 'Date',
            publishedSettings: { 'Type.Editor': 'published', 'Editor.ReadOnly': 'published', 'Editor.Locale': 'published', 'Editor.StdFont': 'published', 'Editor.StdFontSize': 'published' },
            settingDefinitions: [getTypeEditorSetting('Date'), ...getGlobalEditorSettings()],
            overrides: []
        }]
    },
    {
        id: 'File',
        name: 'File',
        description: 'The base file type – holds a reference to an uploaded file, stored internally',
        baseType: null,
        userDefined: false,
        source: 'System',
        fieldBaseType: true,
        settingDefinitions: [
            getTypeKindSetting('0'),
            { id: 'Type.Editors', name: 'Editors', typeId: 'List', subtypeId: 'BBEditor', mustOverride: true, noDelete: true }
        ],
        settings: {
            'Type.Kind': '0',
            'Type.Editor': 'FileEdit'
        },
        editors: [{
            id: 'FileEdit',
            name: 'Core File Editor',
            type: 'System',
            baseEditorId: 'File',
            publishedSettings: { 'Type.Editor': 'published', 'Editor.ReadOnly': 'published', 'Editor.Locale': 'published', 'Editor.StdFont': 'published', 'Editor.StdFontSize': 'published' },
            settingDefinitions: [getTypeEditorSetting('File'), ...getGlobalEditorSettings()],
            overrides: []
        }]
    },
    {
        id: 'Font',
        name: 'Font',
        description: 'A base font type – stores a reference to a system font.  Has an editor which allows a font to be picked',
        baseType: null,
        userDefined: false,
        source: 'System',
        fieldBaseType: true,
        values: [
            { Id: 'Arial', Text: 'Arial' },
            { Id: 'Verdana', Text: 'Verdana' },
            { Id: 'Helvetica', Text: 'Helvetica' },
            { Id: 'Tahoma', Text: 'Tahoma' },
            { Id: 'Trebuchet MS', Text: 'Trebuchet MS' },
            { Id: 'Times New Roman', Text: 'Times New Roman' },
            { Id: 'Georgia', Text: 'Georgia' },
            { Id: 'Garamond', Text: 'Garamond' },
            { Id: 'Courier New', Text: 'Courier New' },
            { Id: 'Brush Script MT', Text: 'Brush Script MT' }
        ],
        settingDefinitions: [
            getTypeKindSetting('0'),
            { id: 'Font.AllowedValues', name: 'Allowed Values', typeId: 'List', subtypeId: 'IDString' },
            { id: 'Type.Editors', name: 'Editors', typeId: 'List', subtypeId: 'BBEditor', mustOverride: true, noDelete: true }
        ],
        settings: {
            'Type.Kind': '0',
            'Type.Editor': 'FontEdit'
        },
        editors: [{
            id: 'FontEdit',
            name: 'Core Font Editor',
            type: 'System',
            baseEditorId: 'Enum', // Re-use enum editor for dropdown behavior
            publishedSettings: {
                'Type.Editor': 'published',
                'Editor.ReadOnly': 'published',
                'Editor.Locale': 'published',
                'Editor.StdFont': 'published',
                'Editor.StdFontSize': 'published'
            },
            settingDefinitions: [
                getTypeEditorSetting('Font'),
                ...getGlobalEditorSettings()
            ],
            overrides: []
        }]
    },

    // --- Complex / Container Types ---

    {
        id: 'Enum',
        name: 'Enum',
        description: 'The base enum type – stores an integer ID representing one of the configured options',
        baseType: null,
        userDefined: false,
        source: 'System',
        fieldBaseType: true,
        // Type Settings
        values: [], // Default empty options
        settingDefinitions: [
            getTypeKindSetting('0'),
            { id: 'Enum.Options', name: 'Options', typeId: 'List', subtypeId: 'IDString' },
            { id: 'Type.Editors', name: 'Editors', typeId: 'List', subtypeId: 'BBEditor', mustOverride: true, noDelete: true }
        ],
        settings: {
            'Type.Kind': '0',
            'Type.Editor': 'EnumEdit'
        },
        editors: [{
            id: 'EnumEdit',
            name: 'Core Enum Editor',
            type: 'System',
            baseEditorId: 'Enum',
            publishedSettings: {
                'Type.Editor': 'published',
                'Editor.ReadOnly': 'published',
                'Editor.Locale': 'published',
                'Editor.StdFont': 'published',
                'Editor.StdFontSize': 'published'
            },
            settingDefinitions: [
                getTypeEditorSetting('Enum'),
                ...getGlobalEditorSettings()
            ],
            overrides: []
        }]
    },
    {
        id: 'List',
        name: 'List',
        description: 'The base list type – parameterised with an element type, so becomes list of string, list of person',
        baseType: null,
        userDefined: false,
        source: 'System',
        fieldBaseType: false, // Not directly usable as field, used via "Based On: List"
        subtypeId: 'String', // Default subtype
        // Type Settings
        settingDefinitions: [
            getTypeKindSetting('0'),
            { id: 'List.Ordered', name: 'Ordered', typeId: 'Boolean', description: 'If true, the list order is important' },
            { id: 'Type.Editors', name: 'Editors', typeId: 'List', subtypeId: 'BBEditor', mustOverride: true, noDelete: true }
        ],
        settings: {
            'Type.Kind': '0',
            'Type.Editor': 'ListEdit'
        },
        editors: [{
            id: 'ListEdit',
            name: 'Core List Editor',
            type: 'System',
            baseEditorId: 'List',
            publishedSettings: {
                'Type.Editor': 'published',
                'List.CoreEdit.ShowDragHandles': 'published',
                'List.CoreEdit.RowSelection': 'published',
                'List.CoreEdit.HasHeaders': 'published',
                'Editor.ReadOnly': 'published',
                'Editor.Locale': 'published',
                'Editor.StdFont': 'published',
                'Editor.StdFontSize': 'published'
            },
            settingDefinitions: [
                getTypeEditorSetting('List'),
                ...getGlobalEditorSettings(),
                { id: 'List.CoreEdit.ShowDragHandles', name: 'Show Drag Handles', typeId: 'Boolean', description: 'Show drag handles for reordering. Automatically hidden if List is not ordered.' },
                { id: 'List.CoreEdit.RowSelection', name: 'Row Selection', typeId: 'Boolean', description: 'If true: show checkboxes + bottom trash can. If false: show per-row trash can.' },
                { id: 'List.CoreEdit.HasHeaders', name: 'Has Headers', typeId: 'Boolean', description: 'If true, instructs the editor to draw headers by temporarily using Horizontal Editor ShowHeaders logic.' }
            ],
            overrides: []
        }]
    },
    {
        id: 'Dict',
        name: 'Dict',
        description: 'A dictionary type – a list of items each of which has a key and a type – similar to a struct, but new items can be added to the list at runtime.',
        baseType: null,
        userDefined: false,
        subtypeId: 'String',
        source: 'System',
        fieldBaseType: true,
        settingDefinitions: [
            getTypeKindSetting('0'),
            { id: 'Type.Editors', name: 'Editors', typeId: 'List', subtypeId: 'BBEditor', mustOverride: true, noDelete: true }
        ],
        settings: {
            'Type.Kind': '0',
            'Type.Editor': 'DictEdit'
        },
        editors: [{
            id: 'DictEdit',
            name: 'Core Dict Editor',
            type: 'System',
            baseEditorId: 'Dict',
            publishedSettings: { 'Type.Editor': 'published', 'Editor.ReadOnly': 'published', 'Editor.Locale': 'published', 'Editor.StdFont': 'published', 'Editor.StdFontSize': 'published' },
            settingDefinitions: [getTypeEditorSetting('Dict'), ...getGlobalEditorSettings()],
            overrides: []
        }]
    },
    {
        id: 'Struct',
        name: 'Struct',
        description: 'The base struct type – used when creating new struct types.  Has a list of fields, and editors to present the fields vertically, horizontally etc',
        baseType: null,
        userDefined: false,
        source: 'System',
        fieldBaseType: false, // Not directly usable as field, used via "Based On: Struct"
        settingDefinitions: [
            getTypeKindSetting('0'),
            { id: 'Struct.Fields', name: 'Fields', typeId: 'List', subtypeId: 'BBField', mustOverride: true, noDelete: true, mandatory: true },
            { id: 'Struct.FieldGroups', name: 'Field Groups', typeId: 'List', subtypeId: 'IDString' },
            { id: 'Type.Editors', name: 'Editors', typeId: 'List', subtypeId: 'BBEditor', mustOverride: true, noDelete: true }
        ],
        fields: [],
        settings: {
            'Type.Kind': '0',
            'Type.Editor': 'VertEdit'
        },
        editors: [{
            id: 'VertEdit',
            name: 'Vertical Struct Editor',
            type: 'System',
            baseEditorId: 'struct-vertical',
            publishedSettings: {
                'Type.Editor': 'published',
                'Struct.VertEdit.PromptPosition': 'published',
                'Struct.VertEdit.PromptMinSpace': 'published',
                'Struct.VertEdit.PromptMaxSpace': 'published',
                'Struct.VertEdit.PromptAlign': 'published',
                'Editor.ControlMinWidth': 'published',
                'Editor.ControlMaxWidth': 'published',
                'Editor.ReadOnly': 'published',
                'Editor.Locale': 'published',
                'Editor.StdFont': 'published',
                'Editor.StdFontSize': 'published'
            },
            settingDefinitions: [
                getTypeEditorSetting('Struct'),
                ...getGlobalEditorSettings(),
                { id: 'Struct.VertEdit.PromptPosition', name: 'Prompt Position', typeId: 'Struct.VertEdit.PromptPosition', description: 'Whether prompts appear Above or to the Left of fields' },
                { id: 'Struct.VertEdit.PromptMinSpace', name: 'Prompt Min Space', typeId: 'Number', description: 'Minimum pixels for prompt gap (only valid if PromptPosition=Left). 0 = ignored' },
                { id: 'Struct.VertEdit.PromptMaxSpace', name: 'Prompt Max Space', typeId: 'Number', description: 'Maximum pixels for prompt gap (only valid if PromptPosition=Left). 0 = ignored (defaults to 1000)' },
                { id: 'Struct.VertEdit.PromptAlign', name: 'Prompt Align', typeId: 'Struct.VertEdit.PromptAlign', description: 'Left or Right alignment of prompts within prompt gap (only valid if PromptPosition=Left)' }
            ],
            overrides: []
        },
        {
            id: 'HorzEdit',
            name: 'Horizontal Struct Editor',
            type: 'System',
            baseEditorId: 'struct-horizontal',
            publishedSettings: {
                'Type.Editor': 'published',
                'Struct.HorzEdit.ControlGap': 'published',
                'Struct.HorzEdit.ShowGroup': 'published',
                'Struct.HorzEdit.Buttons': 'published',
                'Struct.HorzEdit.ShowHeaders': 'published',
                'Editor.ControlMinWidth': 'published',
                'Editor.ControlMaxWidth': 'published',
                'Editor.ReadOnly': 'published',
                'Editor.Locale': 'published',
                'Editor.StdFont': 'published',
                'Editor.StdFontSize': 'published'
            },
            settingDefinitions: [
                getTypeEditorSetting('Struct'),
                ...getGlobalEditorSettings(),
                { id: 'Struct.HorzEdit.ControlGap', name: 'Control Gap', typeId: 'Number', description: 'Gap in pixels between each field editor', defaultValue: 10 },
                { id: 'Struct.HorzEdit.ShowGroup', name: 'Show Group', typeId: 'String', description: 'Name of the Field Group to show. If set, only shows fields in this group.' },
                { id: 'Struct.HorzEdit.Buttons', name: 'Buttons', typeId: 'List', subtypeId: 'Button', description: 'Buttons to show at the right side' },
                { id: 'Struct.HorzEdit.ShowHeaders', name: 'Show Headers', typeId: 'Boolean', description: 'If true, show a header block with field names above controls' }
            ],
            overrides: []
        }]
    },
    {
        id: 'Union',
        name: 'Union',
        description: 'The base union type – used to create a value which can be one of N types',
        baseType: null,
        userDefined: false,
        source: 'System',
        fieldBaseType: false, // Not directly usable as field, used via "Based On: Union"
        settingDefinitions: [
            getTypeKindSetting('0'),
            { id: 'Type.Editors', name: 'Editors', typeId: 'List', subtypeId: 'BBEditor', mustOverride: true, noDelete: true }
        ],
        fields: [],
        settings: {
            'Type.Kind': '0',
            'Type.Editor': 'UnionEdit'
        },
        editors: [{
            id: 'UnionEdit',
            name: 'Core Union Editor',
            type: 'System',
            baseEditorId: 'Union',
            publishedSettings: {
                'Type.Editor': 'published',
                'Editor.ReadOnly': 'published',
                'Editor.Locale': 'published',
                'Editor.StdFont': 'published',
                'Editor.StdFontSize': 'published'
            },
            settingDefinitions: [
                getTypeEditorSetting('Union'),
                ...getGlobalEditorSettings()
            ],
            overrides: []
        }]
    },

    // --- Helpers / Constants ---
    {
        id: 'ButtonAction',
        name: 'Button Action',
        description: 'Action to take when a button is pressed',
        baseType: 'Enum',
        userDefined: false,
        source: 'System',
        fieldBaseType: true,
        values: [
            { id: 0, text: 'ModalEdit' },
            { id: 1, text: 'OpenWebPage' }
        ],
        settingDefinitions: [
            getTypeKindSetting('0'),
            { id: 'Type.Editors', name: 'Editors', typeId: 'List', subtypeId: 'BBEditor', mustOverride: true, noDelete: true }
        ],
        editors: [{
            id: 'default',
            name: 'Dropdown',
            type: 'System',
            baseEditorId: 'Enum',
            publishedSettings: {},
            settingDefinitions: [],
            overrides: []
        }]
    },
    {
        id: 'Button',
        name: 'Button',
        description: 'Definition of a button to appear on the UI',
        baseType: 'Struct',
        userDefined: false,
        source: 'System',
        fieldBaseType: true,
        settingDefinitions: [
            getTypeKindSetting('0'),
            { id: 'ButtonText', name: 'Button Text', typeId: 'String' },
            { id: 'ButtonAction', name: 'Button Action', typeId: 'ButtonAction' },
            { id: 'ButtonParam', name: 'Button Parameter', typeId: 'String' },
            { id: 'Type.Editors', name: 'Editors', typeId: 'List', subtypeId: 'BBEditor', mustOverride: true, noDelete: true }
        ],
        fields: [
            { name: 'ButtonText', typeId: 'String' },
            { name: 'ButtonAction', typeId: 'ButtonAction' },
            { name: 'ButtonParam', typeId: 'String' }
        ],
        editors: [{
            id: 'default',
            name: 'Default',
            type: 'System',
            baseEditorId: 'struct-vertical',
            publishedSettings: {},
            settingDefinitions: [],
            overrides: []
        }]
    },
    {
        id: 'IDString',
        name: 'IDString',
        description: 'A structure that represents {ID, String} – used when making lists of strings each of which needs to have an ID',
        baseType: null,
        userDefined: false,
        source: 'System',
        fieldBaseType: true,
        fields: [
            { name: 'Id', typeId: 'Number' },
            { name: 'Text', typeId: 'String' }
        ],
        settingDefinitions: [
            getTypeKindSetting('0'),
            { id: 'Struct.Fields', name: 'Fields', typeId: 'Custom', mustOverride: true, noDelete: true, mandatory: true },
            { id: 'Type.Editors', name: 'Editors', typeId: 'List', subtypeId: 'BBEditor', mustOverride: true, noDelete: true }
        ],
        publishedSettings: {
            'Struct.FieldGroups': 'hidden'
        },
        editors: [{
            id: 'default',
            name: 'Core Struct Editor',
            type: 'System',
            baseEditorId: 'struct-horizontal',
            publishedSettings: {},
            settingDefinitions: [],
            overrides: []
        }]
    },

    // --- Meta Types ---

    {
        id: 'BBField',
        name: 'BBField',
        description: 'Definition of a field in a struct type',
        baseType: 'Struct',
        userDefined: false,
        source: 'System',
        fieldBaseType: false,
        fields: [
            { name: 'name', typeId: 'String' },
            { name: 'typeId', typeId: 'String' },
            { name: 'label', typeId: 'String' },
            { name: 'description', typeId: 'String' }
        ],
        settingDefinitions: [
            getTypeKindSetting('0'),
            { id: 'Type.Editors', name: 'Editors', typeId: 'List', subtypeId: 'BBEditor', mustOverride: true, noDelete: true }
        ],
        settings: {
            'Type.Kind': '0',
            'Type.Editor': 'VertEdit'
        },
        editors: [
            {
                id: 'VertEdit',
                name: 'Vertical Struct Editor',
                type: 'System',
                baseEditorId: 'struct-vertical',
                publishedSettings: {},
                settingDefinitions: [],
                overrides: []
            },
            {
                id: 'HorzEdit',
                name: 'Horizontal Struct Editor',
                type: 'System',
                baseEditorId: 'struct-horizontal',
                publishedSettings: {},
                settingDefinitions: [],
                overrides: []
            }
        ]
    },
    {
        id: 'BBEditor',
        name: 'BBEditor',
        description: 'Definition of an editor for a type',
        baseType: 'Struct', // Based on Struct
        userDefined: false,
        source: 'System',
        fieldBaseType: false,
        fields: [
            { name: 'id', typeId: 'String' },
            { name: 'name', typeId: 'String' },
            { name: 'baseEditorId', typeId: 'String' },
            { name: 'type', typeId: 'String' } // Useful to see System vs Custom
        ],
        settingDefinitions: [
            getTypeKindSetting('0'),
            { id: 'Type.Editor', name: 'Default Editor', typeId: 'TypeEditor', subtypeId: 'BBEditor', description: 'Select which editor to use for BBEditor fields' },
            { id: 'Type.Editors', name: 'Editors', typeId: 'List', subtypeId: 'BBEditor', mustOverride: true, noDelete: true }
        ],
        settings: {
            'Type.Kind': '0',
            'Type.Editor': 'VertEdit'
        },
        editors: [
            {
                id: 'VertEdit',
                name: 'Vertical Struct Editor',
                type: 'System',
                baseEditorId: 'struct-vertical',
                publishedSettings: {},
                settingDefinitions: [getTypeEditorSetting('BBEditor')],
                overrides: []
            },
            {
                id: 'HorzEdit',
                name: 'Horizontal Struct Editor',
                type: 'System',
                baseEditorId: 'struct-horizontal',
                publishedSettings: {},
                settingDefinitions: [],
                overrides: []
            }
        ]
    },
    {
        id: 'BBType',
        name: 'BBType',
        description: 'The meta-type representing all available data types in the system. Includes an Editor to allow the user to pick a Type, uses Settings to control which types to show in the list',
        baseType: null,
        userDefined: false,
        source: 'System',
        fieldBaseType: false, // Meta-type, not for struct fields
        isDynamic: true, // Flag to indicate values are computed dynamically

        // Type Settings control which types appear in the list
        settingDefinitions: [
            getTypeKindSetting('0'),
            { id: 'Type.Editors', name: 'Editors', typeId: 'List', subtypeId: 'BBEditor', mustOverride: true, noDelete: true },
            getTypeEditorSetting('BBType'),
            { id: 'BBType.SystemSource', name: 'System Types', typeId: 'Boolean' },
            { id: 'BBType.TypeSource', name: 'Type Defined', typeId: 'Boolean' },
            { id: 'BBType.UserSource', name: 'User Defined', typeId: 'Boolean' },
            { id: 'BBType.FieldBase', name: 'Field Base Types Only', typeId: 'Boolean' }
        ],

        settings: {
            'Type.Kind': '0',
            'Type.Editor': 'TypePick'
        },
        values: [], // Populated dynamically based on settings
        editors: [{
            id: 'TypePick',
            name: 'Type Picker',
            type: 'System',
            baseEditorId: 'TypePicker',
            publishedSettings: {},
            settingDefinitions: [],
            overrides: []
        }]
    },
    {
        id: 'TypeEditor',
        name: 'TypeEditor',
        description: 'Stores the ID of a Type Editor.  Has an Editor itself which presents a list of editors for a given Type',
        baseType: 'Core',
        userDefined: false,
        source: 'System',
        fieldBaseType: false, // Meta-type, not for struct fields
        isDynamic: true, // Flag to indicate values are computed dynamically

        // Type Setting specifies which type's editors to show
        settingDefinitions: [
            getTypeKindSetting('0'),
            { id: 'TypeEditor.Type', name: 'Type', typeId: 'BBType' },
            { id: 'Type.Editors', name: 'Editors', typeId: 'List', subtypeId: 'BBEditor', mustOverride: true, noDelete: true }
        ],

        values: [], // Populated dynamically based on selected type's editors
        settings: {
            'Type.Kind': '0',
            'Type.Editor': 'EditPick'
        },
        editors: [{
            id: 'EditPick',
            name: 'Editor Picker',
            type: 'System',
            baseEditorId: 'Enum',
            publishedSettings: {},
            settingDefinitions: [],
            overrides: []
        }]
    },

    // --- Hidden / Internal Templates ---

    {
        id: 'StructBase',
        name: 'Struct Base',
        description: 'Internal template used when creating new Struct types',
        baseType: 'Struct',
        userDefined: false,
        isAnonymous: true,
        source: 'System',
        fieldBaseType: false,
        settings: {
            'Type.Kind': '1',
            'Type.Editor': 'VertEdit'
        },
        editors: [{
            id: 'VertEdit',
            name: 'Vertical Struct Editor',
            type: 'System',
            baseEditorId: 'struct-vertical',
            publishedSettings: {
                'Type.Editor': 'published',
                'Struct.VertEdit.PromptPosition': 'published',
                'Struct.VertEdit.PromptMinSpace': 'published',
                'Struct.VertEdit.PromptMaxSpace': 'published',
                'Editor.ReadOnly': 'published',
                'Editor.Locale': 'published',
                'Editor.StdFont': 'published',
                'Editor.StdFontSize': 'published'
            },
            settingDefinitions: [
                getTypeKindSetting('1'),
                getTypeEditorSetting('Struct'),
                { id: 'Struct.VertEdit.PromptPosition', name: 'Prompt Position', typeId: 'Struct.VertEdit.PromptPosition', description: 'Position of field labels' },
                { id: 'Struct.VertEdit.PromptMinSpace', name: 'Prompt Min Space', typeId: 'Number', description: 'Minimum width for prompt area (pixels)' },
                { id: 'Struct.VertEdit.PromptMaxSpace', name: 'Prompt Max Space', typeId: 'Number', description: 'Maximum width for prompt area (pixels)' },
                ...getGlobalEditorSettings()
            ],
            overrides: []
        }]
    },
    {
        id: 'ListBase',
        name: 'List Base',
        description: 'Internal template used when creating new List types',
        baseType: 'List',
        userDefined: false,
        isAnonymous: true,
        subtypeId: 'String',
        source: 'System',
        fieldBaseType: false,
        // Type Settings
        publishedSettings: {
            'List.Ordered': 'published'
        },
        settingDefinitions: [
            getTypeKindSetting('1'),
            { id: 'List.Ordered', name: 'Ordered', typeId: 'Boolean', description: 'If true, the list order is important' }
        ],
        editors: [{
            id: 'default', // Keep ID default for backward compat? or rename id to 'vertical'? User asked to rename "default list editor to Vertical". Usually implies name. ID 'default' is safe for now as it's the default.
            name: 'Vertical List Editor',
            type: 'System',
            baseEditorId: 'List',
            publishedSettings: {
                'Type.Editor': 'published',
                'Editor.ReadOnly': 'published',
                'Editor.Locale': 'published',
                'List.EditVertical.ShowDragHandles': 'published',
                'List.EditVertical.SelectionCheckbox': 'published'
            },
            settingDefinitions: [
                getTypeEditorSetting('List'),
                ...getGlobalEditorSettings(),
                { id: 'List.EditVertical.ShowDragHandles', name: 'Show Drag Handles', typeId: 'Boolean' },
                { id: 'List.EditVertical.SelectionCheckbox', name: 'Selection Checkbox', typeId: 'Boolean' }
            ],
            overrides: []
        }]
    },

    // --- Validation Types ---

    {
        id: 'String.ValidationRule',
        name: 'String.ValidationRule',
        baseType: 'Struct',
        userDefined: false,
        isAnonymous: false,
        source: 'Type Defined',
        fieldBaseType: false,
        sourceType: 'Struct',
        fields: [
            { name: 'Regexp', typeId: 'String' },
            { name: 'ErrMsg', typeId: 'String' }
        ],
        editors: [{ id: 'default', name: 'Default', type: 'System', baseEditorId: 'struct-vertical', publishedSettings: {}, settingDefinitions: [], overrides: [] }]
    },
    {
        id: 'String.ValidationRules',
        name: 'String.ValidationRules',
        baseType: 'List',
        subtypeId: 'String.ValidationRule',
        userDefined: false,
        isAnonymous: true,
        source: 'Type Defined',
        fieldBaseType: false,
        sourceType: 'String',
        editors: [{
            id: 'default',
            name: 'Default',
            type: 'System',
            baseEditorId: 'List',
            publishedSettings: {},
            settingDefinitions: [],
            overrides: [
                { fieldName: '*', settingId: 'List.EditVertical.ShowDragHandles', value: false },
                { fieldName: '*', settingId: 'List.EditVertical.SelectionCheckbox', value: false }
            ]
        }]
    },

    // Struct Editor Setting Types (for Vertical Struct Editor)
    {
        id: 'Struct.VertEdit.PromptPosition',
        name: 'Struct.VertEdit.PromptPosition',
        baseType: 'Enum',
        userDefined: false,
        source: 'Type Defined',
        fieldBaseType: false,
        isAnonymous: true,
        sourceType: 'Struct',
        values: [
            { id: 0, text: 'Left' },
            { id: 1, text: 'Above' },
            { id: 2, text: 'Inside' }
        ],
        editors: [{
            id: 'default',
            name: 'Default',
            type: 'System',
            baseEditorId: 'Enum',
            publishedSettings: {},
            settingDefinitions: [],
            overrides: []
        }]
    },
    {
        id: 'Struct.VertEdit.PromptAlign',
        name: 'Struct.VertEdit.PromptAlign',
        baseType: 'Enum',
        userDefined: false,
        source: 'Type Defined',
        fieldBaseType: false,
        isAnonymous: true,
        sourceType: 'Struct',
        values: [
            { id: 0, text: 'Left' },
            { id: 1, text: 'Right' }
        ],
        editors: [{
            id: 'default',
            name: 'Default',
            type: 'System',
            baseEditorId: 'Enum',
            publishedSettings: {},
            settingDefinitions: [],
            overrides: []
        }]
    }
];
