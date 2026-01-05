import { Injectable } from '@angular/core';
import { BBType, BBField, BBEditor, BBSettingDefinition } from '../../models/bb-types';
import { BBTypeService } from '../../services/bb-type.service';
import { SettingsService } from '../../services/settings.service';
import { calculateControlWidth } from '../layout-helpers';

export interface BBSettingListItem {
    id: string;
    label: string;
    value: any;
    type: 'setting' | 'group-header';
    settingDef?: BBSettingDefinition;
    scope?: string;
    hidden?: boolean;
    readOnly?: boolean;
    group?: number;
}

@Injectable({
    providedIn: 'root'
})
export class BBTypeBuilderService {

    constructor(
        private bbTypeService: BBTypeService,
        private settingsService: SettingsService
    ) { }

    /**
     * Initialize settings list from type definition
     */
    initializeSettingsList(type: BBType): BBSettingListItem[] {
        const settingsList: BBSettingListItem[] = [];
        const allDefs = this.bbTypeService.getAvailableSettings(type);

        // Group settings by group number
        const grouped = new Map<number, BBSettingDefinition[]>();
        allDefs.forEach(def => {
            const group = (def as any).group ?? 0; // Fix: access group property
            if (!grouped.has(group)) {
                grouped.set(group, []);
            }
            grouped.get(group)!.push(def);
        });

        // Sort groups
        const sortedGroups = Array.from(grouped.keys()).sort((a, b) => a - b);

        sortedGroups.forEach(groupNum => {
            const defs = grouped.get(groupNum)!;

            // Add group header if not default group
            if (groupNum > 0) {
                settingsList.push({
                    id: `group-${groupNum}`,
                    label: `Group ${groupNum}`,
                    value: null,
                    type: 'group-header',
                    group: groupNum
                });
            }

            // Add settings in this group
            defs.forEach(def => {
                const value = type.settings?.[def.id] ?? def.defaultValue;

                settingsList.push({
                    id: def.id,
                    label: def.name,
                    value: value,
                    type: 'setting',
                    settingDef: def,
                    scope: 'root',
                    hidden: false,
                    readOnly: def.readOnly || false,
                    group: groupNum
                });
            });
        });

        return settingsList;
    }

    /**
     * Validate mandatory settings
     */
    validateMandatorySettings(type: BBType, settingsList: BBSettingListItem[]): { valid: boolean; message?: string } {
        const mandatorySettings = settingsList.filter(item => item.settingDef?.mandatory);

        if (!type.settings) type.settings = {};

        for (const item of mandatorySettings) {
            if (item.settingDef?.id === 'Struct.Fields') {
                const fields = type.settings['Struct.Fields'];
                if (!fields || fields.length === 0) {
                    return { valid: false, message: `The '${item.label}' setting is mandatory. Please add at least one field.` };
                }
            } else {
                const val = item.value;
                if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '') || (Array.isArray(val) && val.length === 0)) {
                    return { valid: false, message: `The '${item.label}' setting is mandatory.` };
                }
            }
        }

        return { valid: true };
    }

    /**
     * Sync settings from list back to type object
     */
    syncSettingsToType(type: BBType, settingsList: BBSettingListItem[]): void {
        if (!type.settings) type.settings = {};
        settingsList.forEach(item => {
            if (item.type === 'setting' && item.settingDef) {
                type.settings![item.settingDef.id] = item.value;
            }
        });
    }

    /**
     * Calculate control widths for a type
     */
    calculateWidths(type: BBType, editor: any, settings: Record<string, any>): { min: number; max: number } {
        return calculateControlWidth(type, editor, settings, this.bbTypeService);
    }

    /**
     * Update a specific setting in the list
     */
    updateSettingInList(settingsList: BBSettingListItem[], settingId: string, value: any): void {
        const item = settingsList.find(x => x.settingDef?.id === settingId);
        if (item) {
            item.value = value;
            if (settingId === 'Editor.ControlMinWidth' || settingId === 'Editor.ControlMaxWidth') {
                item.readOnly = true;
            }
        }
    }

    /**
     * Add a field to the type
     */
    addField(type: BBType): void {
        if (!type.settings) type.settings = {};
        if (!type.settings['Struct.Fields']) {
            type.settings['Struct.Fields'] = [];
        }
        type.settings['Struct.Fields'].push({ name: '', typeId: 'String' });
    }

    /**
     * Remove a field from the type
     */
    removeField(type: BBType, index: number): void {
        if (!type.settings) type.settings = {};
        const fields = type.settings['Struct.Fields'] || [];
        fields.splice(index, 1);
        type.settings['Struct.Fields'] = fields;
    }

    /**
     * Set the default editor for a type
     */
    setDefaultEditor(type: BBType, editorId: string): void {
        if (!type.settings) type.settings = {};
        type.settings['Type.Editor'] = editorId;
    }

    /**
     * Remove an editor from the type
     */
    removeEditor(type: BBType, editor: any): void {
        const index = type.editors.indexOf(editor);
        if (index > -1) {
            type.editors.splice(index, 1);
        }

        // If removed editor was the default, set a new default
        if (!type.settings) type.settings = {};
        if (type.settings['Type.Editor'] === editor.id) {
            if (type.editors.length > 0) {
                type.settings['Type.Editor'] = type.editors[type.editors.length - 1].id;
            } else {
                type.settings['Type.Editor'] = 'VertEdit';
            }
        }
    }

    /**
     * Get available editors for a setting item
     */
    getEditorsForItem(type: BBType, item: BBSettingListItem, availableEditors: any[]): any[] {
        // Special case: Type.Editor should show THIS type's editors
        if (item.settingDef?.id === 'Type.Editor' && (!item.scope || item.scope === 'root')) {
            return type.editors || [];
        }

        if (!item.scope || item.scope === 'root') {
            return availableEditors;
        }

        if (item.scope.startsWith('field:')) {
            const fieldName = item.scope.split('field:')[1];
            const fields = type.settings?.['Struct.Fields'] || [];
            const field = fields.find((f: any) => f.name === fieldName);
            if (field) {
                const fieldType = this.bbTypeService.getTypes().find(t => t.id === field.typeId);
                if (fieldType) {
                    if (fieldType.editors && fieldType.editors.length > 0) return fieldType.editors;
                    return this.bbTypeService.getDefaultEditorsForBase(fieldType.baseType, fieldType.subtypeId);
                }
            }
        }
        return [];
    }
}
