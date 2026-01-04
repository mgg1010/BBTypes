import { BBType, BBEditor } from '../models/bb-types';
import { BBTypeService } from '../services/bb-type.service';

const CHAR_WIDTH = 8;
const PADDING = 16;
const ICON_WIDTH = 24;
const CHECKBOX_WIDTH = 24;
const DEFAULT_NUMBER_WIDTH = 8 * CHAR_WIDTH + PADDING; // Fallback
const MAX_WIDTH_INFINITE = 1000;

export function calculateControlWidth(
    type: BBType,
    editor: BBEditor | undefined,
    settings: Record<string, any>,
    typeService: BBTypeService
): { min: number; max: number } {
    if (!editor) return { min: 0, max: 0 };

    const baseId = editor.baseEditorId || 'unknown';

    switch (baseId) {
        case 'number':
            return calcNumberWidth(settings);
        case 'string':
            return calcStringWidth(settings);
        case 'checkbox':
            return { min: CHECKBOX_WIDTH, max: CHECKBOX_WIDTH };
        case 'radio':
            return calcBooleanRadioWidth(settings);
        case 'enum':
            // Handles Enum and Boolean Dropdown
            return calcEnumWidth(type, settings);
        case 'struct-vertical':
            // Logic for Vertical Struct - requires inspecting fields
            // Assuming this is handled by aggregating field widths provided by layout system
            // For now, return a default or implementation placeholder
            // In a real system, we'd need to recursively calc fields.
            return { min: 300, max: MAX_WIDTH_INFINITE };
        default:
            return { min: 100, max: MAX_WIDTH_INFINITE };
    }
}

function calcNumberWidth(settings: Record<string, any>): { min: number; max: number } {
    let maxChars = 0;

    const allowNegative = settings['Number.AllowNegative'] !== false; // Default true
    const minEnabled = settings['Number.MinValueEnabled'] === true;
    const minValue = settings['Number.MinValue'] ?? 0;

    // Add sign char if needed
    if (allowNegative && (!minEnabled || minValue < 0)) {
        maxChars += 1;
    }

    const maxEnabled = settings['Number.MaxValueEnabled'] === true;
    const maxValue = settings['Number.MaxValue'];

    if (maxEnabled && typeof maxValue === 'number') {
        const digits = Math.floor(Math.log10(Math.abs(maxValue || 1))) + 1;
        maxChars += digits;
    } else {
        // Default reasonable size
        maxChars += 8;
    }

    const allowDecimals = settings['Number.AllowDecimals'] !== false; // Default true
    if (allowDecimals) {
        maxChars += 1 + 5; // Dot + 5 decimal places
    }

    // Overhead for up/down arrows (browser dependent, usually ~20px)
    const ARROW_OVERHEAD = 20;
    const width = (maxChars * CHAR_WIDTH) + PADDING + ARROW_OVERHEAD;

    return { min: width, max: width };
}

function calcStringWidth(settings: Record<string, any>): { min: number; max: number } {
    const minLen = settings['String.MinLen'] ?? 0;
    const minPx = (minLen * CHAR_WIDTH) + PADDING;

    // Max is usually infinite for text boxes unless restricted?
    // User said: "Max Length gives us the min characters... convert to pixels, add the rest of the editor box size"
    // Actually user said for String Editor: "Min Length gives us the min characters and we convert this to pixels"
    // They didn't explicitly say how to calc Max pixels for string, but implied 1000 for infinite.
    return { min: minPx, max: MAX_WIDTH_INFINITE };
}

function calcEnumWidth(type: BBType, settings: Record<string, any>): { min: number; max: number } {
    // Determine options
    let options: any[] = [];

    if (type.id === 'boolean') {
        options = [{ text: 'True' }, { text: 'False' }];
    } else {
        // Look in settings
        const optSetting = settings['Enum.Options'];
        if (Array.isArray(optSetting)) {
            options = optSetting;
        }
    }

    let maxTextLen = 0;
    options.forEach(opt => {
        const text = opt.text || opt.label || '';
        if (text.length > maxTextLen) maxTextLen = text.length;
    });

    const width = (maxTextLen * CHAR_WIDTH) + PADDING + ICON_WIDTH;
    return { min: width, max: width }; // Dropdowns usually fixed width based on longest content
}

function calcBooleanRadioWidth(settings: Record<string, any>): { min: number; max: number } {
    // "Calculate size of both option value strings plus size of two radio button icons and the gaps"
    // Boolean is always True/False unless customized labels? standard boolean.
    // Assuming standard True/False
    const textLen = "True".length + "False".length;

    // 2 radio icons (24px each) + Gap (say 10px) + Gap between options (15px)
    const GAP = 10;
    const OPTION_GAP = 20;

    const width = (textLen * CHAR_WIDTH) + (2 * CHECKBOX_WIDTH) + (2 * GAP) + OPTION_GAP;
    return { min: width, max: width };
}
