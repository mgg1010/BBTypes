import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, Type, ViewContainerRef, ViewChild, ComponentRef, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BBTypeService } from '../services/bb-type.service';
import { BBType, BBEditor, IDString } from '../models/bb-types';
import { AppConfig } from '../models/app-models';
import { SettingsService } from '../services/settings.service';
import { EditorRegistryService } from '../services/editor-registry.service';
import { StringEditorComponent } from './string-editor.component';
import { NumberEditorComponent } from './number-editor.component';
import { BooleanEditorComponent } from './boolean-editor.component';
import { FileEditorComponent } from './file-editor.component';
import { EnumEditorComponent } from './enum-editor.component';
import { DateEditorComponent } from './date-editor.component';
import { IEditorComponent, EditorMode, EditorSize } from './editor.interface';
import { ExpressionEditorComponent } from './expression-editor.component';

@Component({
    selector: 'app-dynamic-field',
    standalone: true,
    imports: [CommonModule, ExpressionEditorComponent],
    template: `
    <div class="dynamic-field-wrapper"
         [class.dragging]="isDragging"
         (dragover)="onDragOver($event)"
         (dragleave)="onDragLeave($event)"
         (drop)="onDrop($event)">
        <ng-template #container></ng-template>
        @if (mode === 'expression') {
            <app-expression-editor
                [value]="value ? value.toString() : ''"
                (valueChange)="onExpressionChange($event)"
                [size]="size"
                [pendingVariable]="pendingVariable"
                (exitExpressionMode)="exitExpressionMode()">
            </app-expression-editor>
        }
        @if (error) {
            <div class="error">{{ error }}</div>
        }
    </div>
  `,
    styles: [`
    .error { color: red; font-size: 11px; }
    :host { display: block; width: 100%; }
    .dynamic-field-wrapper {
        width: 100%;
        min-height: 30px;
        border: 1px solid transparent;
        border-radius: 4px;
    }
    .dynamic-field-wrapper.dragging {
        border: 2px dashed #2196F3;
        background: rgba(33, 150, 243, 0.05);
    }
  `]
})
export class DynamicFieldComponent implements OnChanges {
    @Input() typeId!: string;
    @Input() subtypeId?: string; // For parameterized types (List, TypeEditor)
    @Input() defaultEditorId?: string; // Force a specific editor
    @Input() appConfig: AppConfig | null = null;
    @Input() value: any;
    @Input() mode: EditorMode = 'edit';
    @Input() size: EditorSize = 'medium';
    @Input() settings: Record<string, any> = {};
    @Input() explicitValues?: IDString[];
    @Input() runtimeOverrides: any[] = []; // BBSettingOverride[]
    @Input() editorId?: string;
    @Input() fieldName: string = '*';
    @Output() valueChange = new EventEmitter<any>();
    @Output() modeChange = new EventEmitter<EditorMode>();

    @ViewChild('container', { read: ViewContainerRef, static: true }) container!: ViewContainerRef;

    componentRef?: ComponentRef<any>;
    error?: string;
    isDragging = false;
    pendingVariable: any = null;
    previousValue: any = null;
    @Input() isDisabled = false;

    // Track previous values to avoid unnecessary reloads
    private previousTypeId?: string;
    private previousSubtypeId?: string;
    private previousEditorId?: string;
    private previousMode?: EditorMode;
    private previousSize?: EditorSize;

    constructor(
        private bbTypeService: BBTypeService,
        private settingsService: SettingsService,
        private editorRegistry: EditorRegistryService
    ) { }

    ngOnChanges(changes: SimpleChanges) {
        // Skip loading component if we're in expression mode
        if (this.mode === 'expression') {
            if (this.componentRef) {
                this.componentRef.destroy();
                this.componentRef = undefined;
            }
            return;
        }

        // Only reload if critical inputs actually changed (not just reference changes)
        const needsReload =
            (changes['typeId'] && this.typeId !== this.previousTypeId) ||
            (changes['subtypeId'] && this.subtypeId !== this.previousSubtypeId) ||
            (changes['editorId'] && this.editorId !== this.previousEditorId) ||
            (changes['mode'] && this.mode !== this.previousMode) ||
            (changes['size'] && this.size !== this.previousSize) ||
            (changes['settings'] && this.hasSettingsChanged(changes['settings'].previousValue, this.settings));

        if (needsReload) {
            this.loadComponent();
        } else if (this.componentRef) {
            // Propagate changes to instance
            if (changes['value']) this.componentRef.instance.value = this.value;
            if (changes['appConfig']) this.componentRef.instance.appConfig = this.appConfig;
            if (changes['isDisabled']) {
                if ('isDisabled' in this.componentRef.instance) {
                    this.componentRef.instance.isDisabled = this.isDisabled;
                }
            }
        }
    }

    private hasSettingsChanged(prev: Record<string, any> | undefined, curr: Record<string, any>): boolean {
        if (!prev) return true;

        // Check critical settings that affect component loading
        const criticalKeys = ['Type.Editor', 'Struct.HorzEdit.ShowHeaders', 'List.CoreEdit.ShowHeaders'];
        for (const key of criticalKeys) {
            if (prev[key] !== curr[key]) return true;
        }

        return false;
    }

    async loadComponent() {
        this.container.clear();
        this.error = undefined;

        if (!this.typeId) return;

        // Track current values for next comparison
        this.previousTypeId = this.typeId;
        this.previousSubtypeId = this.subtypeId;
        this.previousEditorId = this.editorId;
        this.previousMode = this.mode;
        this.previousSize = this.size;

        const types = this.appConfig
            ? [...this.bbTypeService.getTypes().filter(t => !t.userDefined), ...this.appConfig.types]
            : this.bbTypeService.getTypes();

        let baseType = types.find(t => t.id === this.typeId);

        // Fallback: Case-insensitive lookup (fixes issues where 'string' is requested but 'String' is defined)
        if (!baseType) {
            baseType = types.find(t => t.id.toLowerCase() === this.typeId.toLowerCase());
        }

        if (!baseType) {
            this.error = `Type not found: ${this.typeId}`;
            return;
        }

        // Clone type definition to allow local modifications (like explicit values) without polluting global state
        // We shallow clone so we can override 'values'.
        const currentType: BBType = { ...baseType };

        // Override subtype if provided (e.g. for parameterized List<T>)
        if (this.subtypeId) {
            currentType.subtypeId = this.subtypeId;
        }

        // Handle dynamic types (BBType and TypeEditor) - compute values at runtime
        if (this.explicitValues) {
            currentType.values = this.explicitValues;
            currentType.isDynamic = true; // Treat as dynamic since we injected values
        } else if (currentType.isDynamic) {
            if (currentType.id === 'BBType') {
                // Compute allowed types based on filter settings
                const systemSource = this.settings['BBType.SystemSource'];
                const typeSource = this.settings['BBType.TypeSource'];
                const userSource = this.settings['BBType.UserSource'];
                const fieldBaseOnly = this.settings['BBType.FieldBase'];

                let filteredTypes = types.filter(t => {
                    // Apply source filters
                    if (systemSource && t.source !== 'System') return false;
                    if (typeSource && t.source !== 'Type Defined') return false;
                    if (userSource && t.source !== 'User Defined') return false;

                    // Apply fieldBase filter
                    if (fieldBaseOnly && !t.fieldBaseType) return false;

                    return true;
                });

                // If no filters set, show field base types by default
                if (!systemSource && !typeSource && !userSource) {
                    filteredTypes = types.filter(t => t.fieldBaseType);
                }

                // Populate values dynamically
                currentType.values = filteredTypes.map(t => ({
                    id: t.id,
                    text: t.name
                }));
            } else if (currentType.id === 'TypeEditor') {
                // Compute allowed editors based on subtypeId (the type whose editors to show)
                const selectedTypeId = this.subtypeId;

                if (selectedTypeId) {
                    const selectedType = types.find(t => t.id === selectedTypeId);
                    if (selectedType && selectedType.editors) {
                        currentType.values = selectedType.editors.map(e => ({
                            id: e.id,
                            text: e.name
                        }));
                    } else {
                        currentType.values = [];
                    }
                } else {
                    currentType.values = [];
                }
            }
        }

        // For Enum types, check if settings provide enum options
        if (currentType.baseType === null && currentType.id === 'Enum' || this.settings['Enum.Options']) {
            const enumOptions = this.settings['Enum.Options'];
            if (enumOptions && Array.isArray(enumOptions)) {
                currentType.values = enumOptions;
            }
        }

        // 1. Resolve which editor to use
        let activeEditor: BBEditor | undefined;
        // Check manual input defaultEditorId, then explicit input editorId, then settings
        const requestedEditorId = this.defaultEditorId || this.editorId || this.settings['Type.Editor'];

        if (requestedEditorId) {
            activeEditor = (currentType.editors || []).find(e => e.id === requestedEditorId);
        }

        if (!activeEditor) {
            activeEditor = (currentType.editors || []).find(e => e.id === 'default') || (currentType.editors || [])[0];
        }

        // 1b. Fallback to a virtual editor if still no editor found (prevents crash)
        if (!activeEditor) {
            activeEditor = {
                id: 'virtual-default',
                name: 'Default',
                type: 'System',
                baseEditorId: this.getFallbackEditorId(currentType),
                publishedSettings: {},
                settingDefinitions: [],
                overrides: []
            };
        }

        // 2. Resolve settings for this level
        // Start with type's base settings (e.g. Struct.Fields for BBField)
        let localSettings = { ...currentType.settings, ...this.settings };
        localSettings = this.settingsService.mergeSettings(localSettings, activeEditor.overrides, this.fieldName);

        // 2b. Apply runtime overrides (for testing)
        if (this.runtimeOverrides?.length) {
            localSettings = this.settingsService.mergeSettings(localSettings, this.runtimeOverrides, this.fieldName);
        }

        // 3. Update dynamic field's own state from settings (e.g. override mode)
        const resolvedMode = this.settingsService.resolveSetting('UI.EditMode', localSettings, this.value) || this.mode;
        const resolvedSize = this.settingsService.resolveSetting('UI.Size', localSettings, this.value) || this.size;

        // 4. Resolve Component via Metadata (baseEditorId) or Fallback
        // Catch invalid 'default' baseEditorId which can happen on malformed Custom Editors from previous bug
        const editorIdToUse = (activeEditor.baseEditorId && activeEditor.baseEditorId !== 'default')
            ? activeEditor.baseEditorId
            : this.getFallbackEditorId(currentType);
        const componentType = await this.getComponentByEditorId(editorIdToUse);

        if (componentType) {
            this.createComponentInstance(componentType, currentType, localSettings, resolvedMode, resolvedSize, activeEditor.id, activeEditor.baseEditorId);
        } else {
            this.error = `Could not resolve component for editor ${editorIdToUse} (Type: ${currentType.baseType})`;
        }
    }

    private getFallbackEditorId(type: BBType): string {
        if (!type) return 'String';

        // Force Metadata types to use their specific editors if fallback logic is ambiguous
        if (type.id === 'BBEditor') return 'struct-vertical';
        if (type.id === 'BBType') return 'TypePicker';

        if (type.baseType === 'Struct' || type.baseType === 'Union') return 'Struct';
        if (type.baseType === 'List') return 'List';
        if (type.baseType === 'Basic') return 'Enum';
        if (type.baseType === 'Core') {
            const root = this.resolveRootType(type);
            return root || 'String';
        }
        // If Root type (null baseType), try component ID same as type ID, or Fallback to String
        if (type.baseType === null) {
            return type.id; // e.g. 'String', 'Number', 'Enum' have registered editors
        }
        return 'String';
    }

    private async getComponentByEditorId(editorId: string): Promise<Type<any> | null> {
        return this.editorRegistry.getComponent(editorId);
    }

    private createComponentInstance(componentClass: Type<any>, type: BBType, settings: Record<string, any>, mode: EditorMode, size: EditorSize, editorId?: string, baseEditorId?: string) {
        this.componentRef = this.container.createComponent(componentClass);
        const instance = this.componentRef.instance;

        instance.subtypeId = type.subtypeId;
        // Fields now come from settings['Struct.Fields'] via getter in struct-vertical-editor
        if (type.values) instance.values = [...type.values];
        (instance as any).bbType = type;

        instance.appConfig = this.appConfig;
        instance.value = this.value;
        instance.mode = mode;
        instance.size = size;
        instance.settings = settings;
        instance.runtimeOverrides = this.runtimeOverrides;
        instance.editorId = editorId;
        instance.baseEditorId = baseEditorId;
        instance.isDisabled = this.isDisabled; // Pass isDisabled to the instance

        if (instance.valueChange) {
            instance.valueChange.subscribe((val: any) => {
                this.value = val;
                this.valueChange.emit(val);
            });
        }
        if (instance.modeChange) {
            instance.modeChange.subscribe((m: EditorMode) => {
                this.mode = m;
                this.modeChange.emit(m);
            });
        }
    }

    onExpressionChange(newValue: string) {
        this.value = newValue;
        this.valueChange.emit(newValue);
    }

    onDragOver(event: DragEvent) {
        if (this.mode === 'expression') return;
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = true;
    }

    onDragLeave(event: DragEvent) {
        this.isDragging = false;
    }

    onDrop(event: DragEvent) {
        if (this.mode === 'expression') return;
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;

        const data = event.dataTransfer?.getData('application/json');
        if (data) {
            try {
                const dropped = JSON.parse(data);
                if (dropped.type === 'variable') {
                    this.pendingVariable = dropped;
                    this.mode = 'expression';
                    this.modeChange.emit('expression');
                }
            } catch (e) {
                console.error('Error parsing dropped data', e);
            }
        }
    }

    exitExpressionMode() {
        this.mode = 'edit';
        this.modeChange.emit('edit');
        this.value = this.previousValue;
        this.valueChange.emit(this.value);
        this.pendingVariable = null;
    }

    resolveRootType(type: BBType): string | undefined {
        if (type.baseType === 'Core') return type.name;
        if (type.baseType === 'Basic' && type.subtypeId) {
            const types = this.appConfig
                ? [...this.bbTypeService.getTypes().filter(t => !t.userDefined), ...this.appConfig.types]
                : this.bbTypeService.getTypes();
            const parent = types.find(t => t.id === type.subtypeId);
            if (parent) return this.resolveRootType(parent);
        }
        return undefined;
    }
}
