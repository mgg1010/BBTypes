import { Injectable, Type } from '@angular/core';
import { StringEditorComponent } from '../shared/string-editor.component';
import { NumberEditorComponent } from '../shared/number-editor.component';
import { BooleanEditorComponent } from '../shared/boolean-editor.component';
import { FileEditorComponent } from '../shared/file-editor.component';
import { EnumEditorComponent } from '../shared/enum-editor.component';
import { DateEditorComponent } from '../shared/date-editor.component';

type EditorEntry =
    | { kind: 'eager'; component: Type<any> }
    | { kind: 'lazy'; loader: () => Promise<any> };

@Injectable({
    providedIn: 'root'
})
export class EditorRegistryService {
    private registry = new Map<string, EditorEntry>();

    constructor() {
        this.registerDefaultEditors();
    }

    private registerDefaultEditors() {
        // Eagerly loaded components
        this.registerEditor('String', StringEditorComponent);
        this.registerEditor('Number', NumberEditorComponent);
        this.registerEditor('checkbox', BooleanEditorComponent);
        this.registerEditor('Boolean', BooleanEditorComponent);
        this.registerEditor('File', FileEditorComponent);
        this.registerEditor('Date', DateEditorComponent);
        this.registerEditor('Enum', EnumEditorComponent);
        this.registerEditor('radio', EnumEditorComponent);
        this.registerEditor('BBType', EnumEditorComponent); // BBType uses an enum-like picker behavior by default

        // Lazy loaded components
        this.registerLazyEditor('Struct', () => import('../shared/struct-editor.component').then(m => m.StructEditorComponent));
        // struct-vertical maps to StructVerticalEditorComponent which seems to exist? 
        this.registerLazyEditor('struct-vertical', () => import('../shared/struct-vertical-editor.component').then(m => m.StructVerticalEditorComponent));
        this.registerLazyEditor('struct-horizontal', () => import('../shared/struct-horizontal-editor.component').then(m => m.StructHorizontalEditorComponent));
        this.registerLazyEditor('List', () => import('../shared/list-editor.component').then(m => m.ListEditorComponent));
        this.registerLazyEditor('Dict', () => import('../shared/dict-editor.component').then(m => m.DictEditorComponent));
        this.registerLazyEditor('TypePicker', () => import('../shared/type-picker-editor.component').then(m => m.TypePickerEditorComponent));

        // Aliases for Root Types acting as Structs
        this.registerLazyEditor('BBEditor', () => import('../shared/struct-vertical-editor.component').then(m => m.StructVerticalEditorComponent));
        this.registerLazyEditor('StructBase', () => import('../shared/struct-vertical-editor.component').then(m => m.StructVerticalEditorComponent));
    }

    registerEditor(id: string, component: Type<any>) {
        this.registry.set(id, { kind: 'eager', component });
    }

    registerLazyEditor(id: string, loader: () => Promise<any>) {
        this.registry.set(id, { kind: 'lazy', loader });
    }

    async getComponent(id: string): Promise<Type<any> | null> {
        let entry = this.registry.get(id);

        // Fallback: Case-insensitive lookup (fixes issues where 'list' is requested but 'List' is registered)
        if (!entry) {
            const lowerId = id.toLowerCase();
            for (const [key, value] of this.registry.entries()) {
                if (key.toLowerCase() === lowerId) {
                    entry = value;
                    break;
                }
            }
        }

        if (!entry) return null;

        if (entry.kind === 'eager') {
            return entry.component;
        } else {
            try {
                return await entry.loader();
            } catch (e) {
                console.error(`Failed to load editor for ${id}`, e);
                return null;
            }
        }
    }
}
