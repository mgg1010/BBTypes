import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BBType, BBSettingDefinition, BBEditor } from '../models/bb-types';
import { INITIAL_CORE_TYPES } from '../bb-types/core-types';

@Injectable({
    providedIn: 'root'
})
export class BBTypeService {
    private typesSubject = new BehaviorSubject<BBType[]>([]);
    types$ = this.typesSubject.asObservable();

    constructor() {
        this.initializeCoreTypes();
        this.loadUserDefinedTypes();
    }

    private initializeCoreTypes() {
        // Deep clone to prevent mutation of the imported constant across HMR or service re-instantiation
        const core = JSON.parse(JSON.stringify(INITIAL_CORE_TYPES));

        this.typesSubject.next(core);
    }

    getTypes(): BBType[] {
        return this.typesSubject.value;
    }

    createNewType(baseTypeId: string, name: string = 'New Type'): BBType {
        const baseType = this.getTypes().find(t => t.id === baseTypeId);
        if (!baseType) {
            throw new Error(`Base type ${baseTypeId} not found`);
        }

        const newType: BBType = {
            id: '', // To be generated or set
            name: name,
            baseType: baseType.baseType, // This might need adjustment if baseType is simply a template?
            // Actually, if we base on 'Struct', baseType is 'Struct'.
            // If we base on 'String', baseType is 'Core' (or inherited). 
            // For now assume we copy baseType property.
            // But if baseType is 'Core', we might want to check specialization. 
            // Let's copy specific props.
            description: '',
            userDefined: true,
            source: 'User Defined',
            fieldBaseType: baseType.fieldBaseType,
            settings: {},
            editors: [], // Start empty, will default via getFallback or copy?
            // User says: "Editors work in exactly the same way... copies the Struct Editors Setting"
            // If Editors are settings, we handle them below. 
            // If they are strictly the 'editors' array, we might need to copy default editors?
            // "When the Person Type is created... system copies the Struct Editors Setting... default Vertical and Horizontal editors copied"
        };

        // Adjust baseType property if inheriting
        if (baseType.baseType === 'Struct') newType.baseType = 'Struct';
        else if (baseType.baseType === 'List') newType.baseType = 'List';
        else if (baseType.baseType === 'Core') {
            newType.baseType = 'Basic'; // Or keep Core? 'Core' is usually system. 
            newType.subtypeId = baseType.id; // e.g. based on String
        }

        // Populate MustOverride Settings
        const availableSettings = this.getAvailableSettings(baseType);
        availableSettings.forEach(def => {
            if (def.mustOverride) {
                // Initialize with default value
                // If it's Struct.Fields, defaultValue might be undefined/empty.
                if (!newType.settings) newType.settings = {};
                newType.settings[def.id] = def.defaultValue !== undefined ? JSON.parse(JSON.stringify(def.defaultValue)) : this.getDefaultValue(def.typeId);

                // Special case for Struct.Fields if default is missing?
                if (def.typeId === 'Custom' && def.id === 'Struct.Fields' && !newType.settings[def.id]) {
                    // fields property is separate on BBType.
                    newType.fields = [];
                }
            }
        });

        // Initialize Editors (if handled as settings or explicit array)
        if (baseType.editors) {
            // "User can then edit this... copy default editors"
            // We copy them as a starting point
            newType.editors = JSON.parse(JSON.stringify(baseType.editors));
        }

        return newType;
    }

    addType(type: BBType) {
        const types = this.getTypes();
        this.typesSubject.next([...types, type]);
        this.saveTypes();
    }

    updateType(updatedType: BBType) {
        const types = this.getTypes();
        const index = types.findIndex(t => t.id === updatedType.id);
        if (index >= 0) {
            types[index] = updatedType;
            this.typesSubject.next([...types]);
            this.saveTypes();
        }
    }

    saveTypes() {
        const userTypes = this.getTypes().filter(t => t.userDefined);
        localStorage.setItem('bb-types-custom', JSON.stringify(userTypes));
    }

    importTypes(newTypes: BBType[]) {
        const currentCore = this.getTypes().filter(t => !t.userDefined);
        const currentCustom = this.getTypes().filter(t => t.userDefined);

        // For simplicity, let's say imported types overwrite existing custom types with same ID
        const mergedCustom = [...currentCustom];
        for (const t of newTypes) {
            const idx = mergedCustom.findIndex(c => c.id === t.id);
            if (idx >= 0) mergedCustom[idx] = t;
            else mergedCustom.push(t);
        }

        this.typesSubject.next([...currentCore, ...mergedCustom]);
        this.saveTypes();
    }

    loadUserDefinedTypes() {
        const saved = localStorage.getItem('bb-types-custom');
        if (saved) {
            try {
                const customTypes = JSON.parse(saved);
                const currentTypes = this.getTypes();
                const coreIds = new Set(currentTypes.filter(t => !t.userDefined).map(t => t.id));

                // Only load types that are userDefined AND don't collide with core IDs
                const filteredCustom = customTypes.filter((t: any) => t.userDefined && !coreIds.has(t.id));

                this.typesSubject.next([...currentTypes.filter(t => !t.userDefined), ...filteredCustom]);
            } catch (err) {
                console.error('Failed to load custom types from localStorage', err);
            }
        }
    }

    getNextAnonymousId(): string {
        const anonTypes = this.getTypes().filter(t => t.id.startsWith('anon-'));
        let maxId = 0;
        anonTypes.forEach(t => {
            const num = parseInt(t.id.replace('anon-', ''));
            if (!isNaN(num) && maxId < num) maxId = num;
        });
        return `anon-${maxId + 1}`;
    }

    getTypeDisplayName(type: BBType): string {
        if (!type.baseType) return type.name;

        if (type.baseType === 'List') {
            const subtype = this.getTypes().find(t => t.id === type.subtypeId);
            return `List of ${subtype ? (subtype.isAnonymous ? this.getTypeDisplayName(subtype) : subtype.name) : '?'}`;
        }
        if (type.baseType === 'Dict') {
            const subtype = this.getTypes().find(t => t.id === type.subtypeId);
            return `Dict of ${subtype ? (subtype.isAnonymous ? this.getTypeDisplayName(subtype) : subtype.name) : '?'}`;
        }
        if (type.baseType === 'Basic') {
            const subtype = this.getTypes().find(t => t.id === type.subtypeId);
            return `Custom ${subtype ? subtype.name : 'Type'}`;
        }
        return `Custom ${type.baseType}`;
    }

    getDefaultValue(typeId: string): any {
        const type = this.getTypes().find(t => t.id === typeId);
        if (!type) {
            // Try to resolve generic core types if typeId is just 'string' etc (though usually they are in the list)
            if (typeId === 'String') return '';
            if (typeId === 'Number') return 0;
            if (typeId === 'Boolean') return false;
            return null;
        }

        if (type.baseType === 'Struct' || type.baseType === 'Union' || type.baseType === 'Dict') {
            return {};
        } else if (type.baseType === 'List') {
            return [];
        } else if (type.values && type.values.length > 0) {
            // Enum - default to first value? or null?
            return type.values[0].id; // or text? usually id
        } else if (type.baseType === 'Basic' && type.subtypeId) {
            // Recursive default for basic type wrapper
            return this.getDefaultValue(type.subtypeId);
        } else {
            // Core types
            const root = type.baseType === 'Core' ? type.name : (type.baseType === null ? type.id : undefined);
            switch (root) {
                case 'String': return '';
                case 'Int': return 0;
                case 'Number': return 0;
                case 'Boolean': return false;
                case 'File': return null;
                case 'Date': return null;
                case 'Dict': return {}; // Core dict
                default: return null;
            }
        }
    }

    clearAllTypes() {
        localStorage.removeItem('bb-types-custom');
        this.initializeCoreTypes();
    }

    // Centralized discovery of all available settings for a type (used by Editor Customization & Test Sidebar)
    getAvailableSettings(type?: BBType): (BBSettingDefinition & { appliesToTypes?: string[] })[] {
        const globals: (BBSettingDefinition & { appliesToTypes?: string[] })[] = [
            { id: 'Type.Editor', name: 'Default Editor', typeId: 'TypeEditor', appliesToTypes: ['*'] }, // Corrected typeId to TypeEditor
            { id: 'Type.Editors', name: 'Available Editors', typeId: 'List', subtypeId: 'BBEditor', mustOverride: true, noDelete: true, appliesToTypes: ['*'] },
            { id: 'String.MaxLength', name: 'Max Length', typeId: 'Number', appliesToTypes: ['String'] },
            { id: 'String.MaxLengthMsg', name: 'Max Length Message', typeId: 'String', appliesToTypes: ['String'] },
            { id: 'String.MinLength', name: 'Min Length', typeId: 'Number', appliesToTypes: ['String'] },
            { id: 'String.MinLengthMsg', name: 'Min Length Message', typeId: 'String', appliesToTypes: ['String'] },
            { id: 'Number.MaxValue', name: 'Max Value', typeId: 'Number', appliesToTypes: ['Number'] },
            { id: 'Number.MinValue', name: 'Min Value', typeId: 'Number', appliesToTypes: ['Number'] },
            { id: 'String.ValidationRules', name: 'Validation Rules', typeId: 'String.ValidationRules', appliesToTypes: ['String'] }
        ];

        if (!type) {
            return globals;
        }

        const settings: BBSettingDefinition[] = [];
        const seen = new Set<string>();

        const addFromType = (typeId: string) => {
            const types = this.getTypes();
            const t = types.find(x => x.id === typeId);
            if (!t) return;

            // Add settings from the type itself (e.g. Struct.Fields, List.Ordered)
            // NOTE: We do NOT add settings from the type's editors here.
            // Editor settings belong in editor tabs, not type-level settings.
            (t.settingDefinitions || []).forEach(def => {
                if (!seen.has(def.id)) {
                    // Clone definition to avoid mutating / to allow dynamic defaults
                    const defClone = { ...def };

                    // Populate default value for Type.Editors if present
                    if (defClone.id === 'Type.Editors' && t.editors && t.editors.length > 0) {
                        defClone.defaultValue = t.editors; // Use editors as-is, don't remap
                    }
                    // Also populate Enum.Options if applicable
                    if (defClone.id === 'Enum.Options' && t.values && t.values.length > 0) {
                        defClone.defaultValue = t.values.map(v => ({
                            Id: v.Id !== undefined ? v.Id : v.id,
                            Text: v.Text !== undefined ? v.Text : v.text
                        }));
                    }

                    settings.push(defClone);
                    seen.add(def.id);
                }
            });
        };

        // 0. Recursive function to add settings from type and its base
        const addRecursive = (t: BBType) => {
            if (!t) return;
            // Add settings from this type
            addFromType(t.id);

            // Add settings from base type
            if (t.baseType) {
                const base = this.getTypes().find(x => x.id === t.baseType);
                if (base) {
                    addRecursive(base);
                } else {
                    // Check special core base types
                }
            }
        };

        addRecursive(type);

        // 1. If it's a struct/union, check fields (recursive config?)
        if (type.fields) {
            // Placeholder
        }

        // 2. If it's a list/dict, check subtype
        if (type.subtypeId) {
            addFromType(type.subtypeId);
        }

        // 3. Merge applicable globals
        globals.forEach(g => {
            if (!seen.has(g.id)) {
                let applies = false;
                if (!g.appliesToTypes) applies = true; // Default apply? Or explicit only? Assume explicit.
                else if (g.appliesToTypes.includes('*')) applies = true;
                else if (g.appliesToTypes.includes(type.id)) applies = true;
                else if (type.baseType && g.appliesToTypes.includes(type.baseType)) applies = true;
                // Check root type matches e.g. String
                else if (!type.baseType && g.appliesToTypes.includes(type.id)) applies = true; // e.g. String matches 'String'

                if (applies) {
                    const settingToAdd = { ...g };
                    // Populate default for Type.Editor
                    if (settingToAdd.id === 'Type.Editor' && type.editors && type.editors.length > 0) {
                        const defEditor = type.editors.find(e => e.id === 'default') || type.editors[0];
                        settingToAdd.defaultValue = defEditor.id;
                    }

                    settings.push(settingToAdd);
                    seen.add(g.id);
                }
            }
        });

        // Also add UI defaults if not present
        // if (!seen.has('UI.Size')) { settings.push({ id: 'UI.Size', name: 'Size', typeId: 'string' }); seen.add('UI.Size'); }

        return settings;
    }

    isTypeReferenced(typeId: string): boolean {
        return this.getTypesReferencing(typeId).length > 0;
    }

    getTypesReferencing(typeId: string): BBType[] {
        const referencingTypes: BBType[] = [];
        const allTypes = this.getTypes();

        for (const type of allTypes) {
            if (type.id === typeId) continue; // Don't check self-references

            // Check subtype usage (List, Dict, Basic)
            if (type.subtypeId === typeId) {
                referencingTypes.push(type);
                continue;
            }

            // Check field usage (Struct, Union) - check both modern and legacy locations
            const fields = type.settings?.['Struct.Fields'] || type.fields;
            if (fields) {
                const fieldUsage = fields.find((f: any) => f.typeId === typeId);
                if (fieldUsage) {
                    referencingTypes.push(type);
                    continue;
                }
            }
        }
        return referencingTypes;
    }

    deleteType(typeId: string) {
        const types = this.getTypes().filter(t => t.id !== typeId);
        this.typesSubject.next(types);
        this.saveTypes();
    }

    getDefaultEditorsForBase(baseKind: string | null, subtypeId?: string): BBEditor[] {
        let baseTypeId = '';

        // If baseKind is null, the subtypeId IS the type we want. 
        // e.g. for BBEditor (baseType=null), we might call this with (null, 'BBEditor') or simply use direct lookup?
        // But this method generally assumes we are looking for a Template to inherit from.
        // If baseType is null, we don't inherit. We use the type's own editors.

        if (baseKind === null || baseKind === 'Core') {
            if (subtypeId) baseTypeId = subtypeId;
            else baseTypeId = 'String'; // Fallback for pure Core?
        } else {
            switch (baseKind) {
                // If we still use these strings in Builder, map them. 
                // But generally we should move to direct type lookups.
                case 'Struct': case 'Union': baseTypeId = 'StructBase'; break;
                case 'List': baseTypeId = 'ListBase'; break;
                // case 'Dict': baseTypeId = 'Dict'; break; // Dict is Core now? Or still baseType? Dict is Root (null).
                case 'Dict': baseTypeId = 'Dict'; break;
                case 'Basic':
                    // Basic usually means Enum in legacy terms or just Typedef?
                    baseTypeId = subtypeId || 'String';
                    break;
                case 'Enum':
                    if (subtypeId === 'boolean' || subtypeId === 'Boolean') baseTypeId = 'Boolean';
                    else baseTypeId = 'Enum';
                    break;
                default:
                    // Try using baseKind as the type ID itself if nothing else matches
                    baseTypeId = baseKind;
                    break;
            }
        }

        const baseType = this.getTypes().find(t => t.id === baseTypeId);

        // Ensure we handle recursive defaults? 
        // If we found a base type, return ITS editors.
        if (baseType && baseType.editors && baseType.editors.length > 0) {
            return JSON.parse(JSON.stringify(baseType.editors));
        }

        // Fallback
        return [{ id: 'default', name: 'Default', type: 'System', baseEditorId: 'String', publishedSettings: {}, settingDefinitions: [], overrides: [] }];
    }
}
