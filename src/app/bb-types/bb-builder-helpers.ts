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
            typeId: 'Struct.VertEdit.PromptPosition'
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
            typeId: 'Struct.VertEdit.PromptAlign'
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
        settingDef: { id: 'Struct.VertEdit.PromptMinSpace', name: 'Struct.VertEdit.PromptMinSpace', typeId: 'Number' }
    });

    list.push({
        id: 'Struct.VertEdit.PromptMaxSpace',
        label: 'Prompt Max Space',
        type: 'setting',
        value: 1000,
        scope: 'root',
        readOnly: true,
        removable: false,
        settingDef: { id: 'Struct.VertEdit.PromptMaxSpace', name: 'Struct.VertEdit.PromptMaxSpace', typeId: 'Number' }
    });


    return list;
}

export function getHorzEditSettings(): BBSettingListItem[] {
    const list: BBSettingListItem[] = [];

    // Header
    list.push({ id: 'h1_base', label: 'Base Editor Settings', type: 'header', scope: 'root' });

    list.push({
        id: 'Struct.HorzEdit.ControlGap',
        label: 'Control Gap',
        type: 'setting',
        value: 10,
        scope: 'root',
        readOnly: true,
        removable: false,
        settingDef: { id: 'Struct.HorzEdit.ControlGap', name: 'Control Gap', typeId: 'Number' }
    });

    list.push({
        id: 'Struct.HorzEdit.ShowGroup',
        label: 'Show Group',
        type: 'setting',
        value: '',
        scope: 'root',
        readOnly: true,
        removable: false,
        settingDef: { id: 'Struct.HorzEdit.ShowGroup', name: 'Show Group', typeId: 'String' }
    });

    list.push({
        id: 'Struct.HorzEdit.Buttons',
        label: 'Buttons',
        type: 'setting',
        value: [],
        scope: 'root',
        readOnly: true,
        removable: false,
        settingDef: { id: 'Struct.HorzEdit.Buttons', name: 'Buttons', typeId: 'List', subtypeId: 'Button' }
    });

    list.push({
        id: 'Struct.HorzEdit.ShowHeaders',
        label: 'Show Headers',
        type: 'setting',
        value: false,
        scope: 'root',
        readOnly: true,
        removable: false,
        settingDef: { id: 'Struct.HorzEdit.ShowHeaders', name: 'Show Headers', typeId: 'Boolean' }
    });

    return list;
}
