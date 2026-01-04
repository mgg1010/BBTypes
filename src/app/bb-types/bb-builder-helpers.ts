import { BBSettingListItem } from '../models/bb-types';

export function getVertEditSettings(): BBSettingListItem[] {
    const list: BBSettingListItem[] = [];

    // Header
    list.push({ id: 'h1_base', label: 'Base Editor Settings', type: 'header', scope: 'root' });

    list.push({
        id: 'Struct.VertEdit.PromptPosition',
        label: 'Prompt Position',
        type: 'setting',
        value: 0,
        scope: 'root',
        readOnly: true,
        removable: false,
        settingDef: {
            id: 'Struct.VertEdit.PromptPosition',
            name: 'Struct.VertEdit.PromptPosition',
            typeId: 'enum',
            values: [
                { id: 0, text: 'Left' },
                { id: 1, text: 'Above' },
                { id: 2, text: 'Inside' }
            ]
        }
    });

    list.push({
        id: 'Struct.VertEdit.PromptAlign',
        label: 'Prompt Align',
        type: 'setting',
        value: 1,
        scope: 'root',
        readOnly: true,
        removable: false,
        settingDef: {
            id: 'Struct.VertEdit.PromptAlign',
            name: 'Struct.VertEdit.PromptAlign',
            typeId: 'enum',
            values: [
                { id: 0, text: 'Left' },
                { id: 1, text: 'Right' }
            ]
        }
    });

    list.push({
        id: 'Struct.VertEdit.PromptMinSpace',
        label: 'Prompt Min Space',
        type: 'setting',
        value: 0,
        scope: 'root',
        readOnly: true,
        removable: false,
        settingDef: { id: 'Struct.VertEdit.PromptMinSpace', name: 'Struct.VertEdit.PromptMinSpace', typeId: 'number' }
    });

    list.push({
        id: 'Struct.VertEdit.PromptMaxSpace',
        label: 'Prompt Max Space',
        type: 'setting',
        value: 1000,
        scope: 'root',
        readOnly: true,
        removable: false,
        settingDef: { id: 'Struct.VertEdit.PromptMaxSpace', name: 'Struct.VertEdit.PromptMaxSpace', typeId: 'number' }
    });

    return list;
}
