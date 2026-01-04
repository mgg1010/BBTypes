import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BBType } from '../models/bb-types';
import { DynamicFieldComponent } from '../shared/dynamic-field.component';
import { AppConfig } from '../models/app-models';
import { BBTypeService } from '../services/bb-type.service';

@Component({
    selector: 'app-bb-type-tester',
    standalone: true,
    imports: [CommonModule, FormsModule, DynamicFieldComponent],
    template: `
    <div class="tester-container">
      <div class="tester-header">
         <h2>Testing: {{ type.name }}</h2>
         <button class="info-btn" (click)="showInfo.emit(type)">ℹ️ Show Info</button>
      </div>

      <div class="test-preview-area">
          <div class="test-field-container">
              <label class="test-label">{{ type.name }}:</label>
              <div class="test-input-wrapper">
                  <app-dynamic-field
                      [typeId]="type.id"
                      [appConfig]="appConfig"
                      [(value)]="testValue"
                      [mode]="'edit'"
                      [size]="'medium'"
                      [editorId]="selectedEditorId"
                      [settings]="testSettings"
                      [runtimeOverrides]="activeOverrides">
                  </app-dynamic-field>
              </div>
          </div>
            
          <div class="test-output">
              <strong>Current Value:</strong>
              <pre>{{ testValue | json }}</pre>
          </div>
      </div>
    </div>
  `,
    styles: [`
    .tester-container {
        padding: 20px;
        height: 100%;
        box-sizing: border-box;
        overflow-y: auto;
    }
    .tester-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
    }
    .tester-header h2 { margin: 0; font-size: 1.2rem; color: #333; }
    
    .info-btn {
      background: #607D8B;
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .info-btn:hover { background: #455A64; }

    .test-preview-area {
      flex: 1;
      padding: 20px;
      background: #fdfdfd;
      border: 1px solid #eee;
      border-radius: 8px;
    }
    .test-field-container {
        padding: 30px;
        background: white;
        border: 1px solid #eee;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.02);
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 20px;
        align-items: flex-start;
    }
    .test-label {
        font-weight: bold;
        color: #555;
        text-align: left;
        margin-top: 6px;
        font-size: 14px;
    }
    .test-input-wrapper { min-width: 0; }
    
    .test-output {
      margin-top: 20px;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
    }
    .test-output pre {
      margin: 5px 0 0 0;
      white-space: pre-wrap;
    }
  `]
})
export class BBTypeTesterComponent implements OnInit, OnChanges {
    @Input() type!: BBType;
    @Input() appConfig: AppConfig | null = null;
    @Input() refreshTrigger = 0;
    @Output() showInfo = new EventEmitter<BBType>();

    testValue: any = null;
    selectedEditorId = 'default';
    testSettings: Record<string, any> = {
        'UI.EditMode': 'edit',
        'UI.Size': 'medium'
    };
    activeOverrides = [];

    constructor(private bbTypeService: BBTypeService) { }

    ngOnInit() {
        // Initialize default value
        this.testValue = this.getDefaultValue(this.type);

        // Select editor
        const defaultEditor = this.type.editors?.find(e => e.id === 'default');
        this.selectedEditorId = defaultEditor?.id || this.type.editors?.[0]?.id || 'default';
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['refreshTrigger'] && !changes['refreshTrigger'].firstChange) {
            // Clone settings to force DynamicField reload
            this.testSettings = { ...this.testSettings, _refresh: Date.now() };
        }
    }

    getDefaultValue(type: BBType): any {
        if (type.baseType === 'List') return [];
        if (type.baseType === 'Struct') return {};
        // Boolean and Number are typically 'Core' types
        if (type.baseType === 'Core') {
            // Heuristic for boolean: values length 2? Or just check type name
            if (type.name === 'Boolean' || type.id === 'boolean') return false;
            if (type.name === 'Number' || type.id === 'number' || type.name === 'Integer') return 0;
        }
        return '';
    }
}
