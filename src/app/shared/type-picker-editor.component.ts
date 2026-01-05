import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IEditorComponent, EditorMode, EditorSize } from './editor.interface';
import { AppConfig } from '../models/app-models';
import { BBTypeService } from '../services/bb-type.service';

@Component({
    selector: 'app-type-picker-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="type-picker-wrapper" [class.readonly]="isDisabled || mode === 'read'">
       @if (mode === 'read') {
         <div class="readonly-value">{{ getDisplayValue() }}</div>
       } @else {
         <select 
            [ngModel]="value" 
            (ngModelChange)="onValueChange($event)"
            [disabled]="isDisabled"
            class="std-select">
            <option [ngValue]="null">Select a Type...</option>
            @for (opt of options; track $index) {
                <option [value]="opt.id">{{ opt.name }}</option>
            }
         </select>
       }
    </div>
  `,
    styles: [`
    :host { display: block; width: 100%; }
    .std-select {
        width: 100%;
        padding: 4px 8px;
        height: 24px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-family: inherit;
        font-size: 13px;
        box-sizing: border-box;
        outline: none;
    }
    .readonly-value {
        padding: 6px;
        background: #f5f5f5;
        border: 1px solid #eee;
        border-radius: 4px;
        color: #555;
    }
  `]
})
export class TypePickerEditorComponent implements IEditorComponent<string>, OnInit, OnChanges {
    @Input() appConfig: AppConfig | null = null;
    @Input() value: any = null;
    @Input() mode: EditorMode = 'edit';
    @Input() size: EditorSize = 'medium';
    @Input() settings: Record<string, any> = {};
    @Input() isDisabled = false;
    @Output() valueChange = new EventEmitter<any>();

    options: { id: string, name: string }[] = [];

    constructor(private bbTypeService: BBTypeService) { }

    ngOnInit() {
        this.loadOptions();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['settings'] || changes['appConfig']) {
            this.loadOptions();
        }
    }

    private loadOptions() {
        // Ensure service is ready (though it's sync usually)
        const types = this.bbTypeService.getTypes();

        const showSystem = this.settings['BBType.SystemSource'] !== false;
        const showTypeDefined = this.settings['BBType.TypeSource'] !== false;
        const showUserDefined = this.settings['BBType.UserSource'] !== false;
        const fieldBaseOnly = this.settings['BBType.FieldBase'] === true;

        this.options = types.filter(t => {
            if (t.source === 'System' && !showSystem && this.hasSetting('BBType.SystemSource')) return false;
            // 'Type Defined' is also label 'Derived' in UI
            if (t.source === 'Type Defined' && !showTypeDefined && this.hasSetting('BBType.TypeSource')) return false;
            if (t.userDefined && !showUserDefined && this.hasSetting('BBType.UserSource')) return false;

            if (fieldBaseOnly && !t.fieldBaseType) return false;

            return true;
        }).map(t => ({
            id: t.id,
            name: t.name
        })).sort((a, b) => a.name.localeCompare(b.name));
    }

    private hasSetting(key: string): boolean {
        return this.settings[key] !== undefined;
    }

    onValueChange(newValue: string) {
        this.value = newValue;
        this.valueChange.emit(newValue);
    }

    getDisplayValue(): string {
        if (!this.value) return '';
        const opt = this.options.find(o => o.id === this.value);
        return opt ? opt.name : this.value;
    }
}
