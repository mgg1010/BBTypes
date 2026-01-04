import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BBType } from '../models/bb-types';
import { AppConfig } from '../models/app-models';
import { DynamicFieldComponent } from './dynamic-field.component';

@Component({
    selector: 'app-generic-editor-dialog',
    standalone: true,
    imports: [CommonModule, DynamicFieldComponent],
    template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 class="text-lg font-semibold text-gray-800">{{ title }}</h3>
          <button (click)="onCancel()" class="text-gray-500 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto flex-1">
          <app-dynamic-field
            [typeId]="typeId"
            [subtypeId]="subtypeId"
            [editorId]="editorId"
            [appConfig]="appConfig"
            [(value)]="draftValue"
            [mode]="'edit'"
            [size]="'medium'"
            [settings]="settings"
            [isDisabled]="false">
          </app-dynamic-field>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <button (click)="onCancel()" class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium transition-colors">Cancel</button>
          <button (click)="onSave()" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition-colors shadow-sm">Save Changes</button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    :host { display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1000; }
  `]
})
export class GenericEditorDialogComponent implements OnInit {
    @Input() title: string = 'Edit Item';
    @Input() typeId!: string;
    @Input() subtypeId?: string;
    @Input() editorId?: string; // The specific editor to load (from ButtonParam)
    @Input() value: any;
    @Input() appConfig: AppConfig | null = null;
    @Input() settings: any = {}; // Optional settings override

    @Output() save = new EventEmitter<any>();
    @Output() cancel = new EventEmitter<void>();

    draftValue: any;

    ngOnInit() {
        // Clone value to avoid direct mutation
        this.draftValue = this.value ? JSON.parse(JSON.stringify(this.value)) : {};
    }

    onSave() {
        this.save.emit(this.draftValue);
    }

    onCancel() {
        this.cancel.emit();
    }
}
