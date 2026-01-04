import { Component, Input, Output, EventEmitter, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorSize } from './editor.interface';
import { QuillEditorComponent, QuillModules } from 'ngx-quill';
import Quill from 'quill';
import { VariableBlot } from './variable-blot';

// Register the custom blot
Quill.register('formats/variable', VariableBlot);

@Component({
    selector: 'app-expression-editor',
    standalone: true,
    imports: [CommonModule, QuillEditorComponent],
    // ViewEncapsulation.None needed to style Quill internals easily from component styles
    encapsulation: ViewEncapsulation.None,
    template: `
    <div class="expression-container" [ngClass]="size" (dragover)="onDragOver($event)" (drop)="onDrop($event)">
      <div class="icon-box" title="Expression Mode">=</div>
      <quill-editor
        #quill
        [modules]="quillModules"
        [placeholder]="''"
        (onEditorCreated)="onEditorCreated($event)"
        (onContentChanged)="onContentChanged($event)"
        class="quill-host">
      </quill-editor>
      <div class="icon-box close-btn" title="Exit Expression Mode" (click)="onExit()">x</div>
    </div>
  `,
    styles: [`
    :host {
        display: block;
        width: 100%;
    }

    .expression-container {
      display: flex;
      align-items: stretch; /* Stretch children to fill height (fixes grey background) */
      border: 1px solid #ccc;
      border-radius: 4px;
      overflow: hidden;
      background: #fff;
      width: 100%;
    }

    .icon-box {
      background: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #555;
      user-select: none;
      font-family: monospace;
      font-weight: bold;
      width: 28px; /* Fixed width matching previous medium size */
      flex-shrink: 0; 
      cursor: default;
    }
    
    .icon-box:first-child {
        border-right: 1px solid #ccc;
    }

    .close-btn {
        border-left: 1px solid #ccc;
        cursor: pointer;
        color: #999;
    }
    .close-btn:hover {
        background: #e0e0e0;
        color: #333;
    }

    /* Style the host component of ngx-quill */
    .quill-host {
        flex: 1; /* Shorthand for flex-grow: 1, flex-shrink: 1, flex-basis: 0% */
        width: 100%; /* Ensure it tries to take full width */
        display: flex;
        flex-direction: column; /* Quill needs to be block-like internally */
        justify-content: center; /* Vertical centering */
        min-width: 0;
        overflow: hidden; /* Contain content */
    }

    /* Override Quill inner styles */
    .ql-container {
        font-family: monospace;
        font-size: inherit;
        height: 100%;
        display: flex;
        align-items: center;
    }
    
    .ql-editor {
        padding: 0 4px !important; /* Minimized padding */
        overflow-y: hidden;
        line-height: inherit;
        width: 100%;
        display: flex;  /* Ensure flex behavior propagates */
        align-items: center;
    }

    /* Force paragraph to have no margin and be centered */
    .ql-editor p {
        margin: 0;
        padding: 0;
        line-height: inherit;
    }
    
    /* Remove default Quill borders if any */
    .ql-container.ql-snow {
        border: none !important;
    }

    /* Chip styling */
    .chip {
      display: inline-block;
      padding: 0 4px;
      border-radius: 4px;
      background: #e1f5fe;
      border: 1px solid #b3e5fc;
      color: #0277bd;
      margin: 0 2px;
      font-size: inherit;
      user-select: none;
      line-height: normal; /* Reset line-height for the chip itself */
      vertical-align: middle; /* Center vertically relative to text */
      transform: translateY(-1px); /* Micro-adjustment for visual center */
    }

    /* Sizes */
    .small {
        font-size: 11px;
        line-height: 1; 
        height: 22px; /* Reduced specific height */
    }
    .small .icon-box {
        width: 20px; 
    }
    
    .medium {
        font-size: 14px;
        line-height: 1;
        height: 28px; /* Reduced specific height */
    }
    .medium .icon-box {
        width: 28px;
    }
  `]
})
export class ExpressionEditorComponent {
    @Input() value: string = '';
    @Input() size: EditorSize = 'medium';
    @Output() valueChange = new EventEmitter<string>();
    @Output() exitExpressionMode = new EventEmitter<void>();

    quillEditor: any;

    quillModules: QuillModules = {
        toolbar: false, // No toolbar
        keyboard: {
            bindings: {
                enter: { key: 13, handler: () => false } // Prevent multiline
            }
        }
    };

    @Input() pendingVariable: any = null;

    onEditorCreated(quill: any) {
        this.quillEditor = quill;

        // If we have a pending variable (from a drop), we ignore the initial value (to avoid "Double Vision")
        // Otherwise, we set the text to the current value
        if (!this.pendingVariable && this.value) {
            this.quillEditor.setText(this.value);
        }

        if (this.pendingVariable) {
            // Insert the pending variable that triggered the switch
            this.quillEditor.insertEmbed(this.quillEditor.getLength(), 'variable', this.pendingVariable, 'user');
            // Clear it so it doesn't re-insert if component re-inits
            this.pendingVariable = null;
        }

        // Bind directly to the root DOM element of Quill to ensure we catch events
        const root = quill.root;

        root.addEventListener('dragover', (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
        });

        root.addEventListener('drop', (e: DragEvent) => {
            this.handleDrop(e);
        });
    }

    onContentChanged(event: any) {
        // Extract text or build a logical string representation
        this.value = event.text;
        this.valueChange.emit(this.value);
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
    }

    onDrop(event: DragEvent) {
        this.handleDrop(event);
    }

    handleDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();

        const data = event.dataTransfer?.getData('application/x-editor-variable');

        if (data && this.quillEditor) {
            const variable = JSON.parse(data);

            // Focus editor
            this.quillEditor.focus();

            // Get cursor position (or end if lost focus)
            const range = this.quillEditor.getSelection(true);
            let index = range ? range.index : this.quillEditor.getLength();

            // Insert the custom blot
            this.quillEditor.insertEmbed(index, 'variable', variable, 'user');

            // Move cursor after the chip
            this.quillEditor.setSelection(index + 1, Quill.sources.SILENT);
        }
    }

    onExit() {
        this.exitExpressionMode.emit();
    }
}
