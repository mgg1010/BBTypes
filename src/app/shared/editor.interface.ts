import { EventEmitter } from '@angular/core';

export type EditorMode = 'edit' | 'read' | 'expression';
export type EditorSize = 'small' | 'medium';

export interface IEditorComponent<T> {
  value: T;
  mode: EditorMode;
  size: EditorSize;
  settings?: Record<string, any>;
  editorId?: string;
  baseEditorId?: string;
  valueChange: EventEmitter<T>;
}
