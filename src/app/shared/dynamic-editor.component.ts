import { Component, Input, Output, EventEmitter, Type, ViewContainerRef, ComponentRef, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IEditorComponent, EditorMode, EditorSize } from './editor.interface';
import { AppConfig } from '../models/app-models';

@Component({
    selector: 'app-dynamic-editor',
    standalone: true,
    imports: [CommonModule],
    template: '',
})
export class DynamicEditorComponent implements OnChanges, OnDestroy {
    @Input() componentType!: Type<IEditorComponent<any>>;
    @Input() value: any;
    @Input() mode: EditorMode = 'read';
    @Input() size: EditorSize = 'medium';
    @Input() appConfig: AppConfig | null = null;
    @Output() valueChange = new EventEmitter<any>();

    private componentRef?: ComponentRef<IEditorComponent<any>>;
    private currentComponentType?: Type<IEditorComponent<any>>;

    constructor(private viewContainerRef: ViewContainerRef) { }

    ngOnChanges(changes: SimpleChanges): void {
        console.log('dynamic-editor ngOnChanges', {
            hasComponentTypeChange: !!changes['componentType'],
            componentType: this.componentType?.name,
            currentType: this.currentComponentType?.name,
            willReload: changes['componentType'] && this.componentType && this.componentType !== this.currentComponentType
        });

        if (changes['componentType'] && this.componentType && this.componentType !== this.currentComponentType) {
            console.log('RELOADING component', this.componentType.name);
            this.loadComponent();
        }

        if (this.componentRef) {
            if (changes['value']) {
                this.componentRef.instance.value = this.value;
            }
            if (changes['mode']) {
                this.componentRef.instance.mode = this.mode;
            }
            if (changes['size']) {
                this.componentRef.instance.size = this.size;
            }
            if (changes['appConfig']) {
                (this.componentRef.instance as any).appConfig = this.appConfig;
            }
        }
    }

    ngOnDestroy(): void {
        if (this.componentRef) {
            this.componentRef.destroy();
        }
    }

    private loadComponent(): void {
        this.viewContainerRef.clear();
        this.componentRef = this.viewContainerRef.createComponent(this.componentType);
        this.currentComponentType = this.componentType; // Track the current type

        // Set initial inputs
        this.componentRef.instance.value = this.value;
        this.componentRef.instance.mode = this.mode;
        this.componentRef.instance.size = this.size;
        (this.componentRef.instance as any).appConfig = this.appConfig;

        // Subscribe to outputs
        this.componentRef.instance.valueChange.subscribe((val: any) => {
            this.valueChange.emit(val);
        });
    }
}
