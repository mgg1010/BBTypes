import { Injectable } from '@angular/core';
import { BBSettingOverride } from '../models/bb-types';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    /**
     * Merges parent settings with current editor overrides.
     * Settings are namespaced (e.g., UI.*, Date.*, Person.*) to avoid collisions.
     */
    mergeSettings(
        parentSettings: Record<string, any>,
        overrides: BBSettingOverride[],
        fieldName: string = '*'
    ): Record<string, any> {
        const merged = { ...parentSettings };

        // Apply overrides that match the current field or are global (*)
        overrides.filter(o => o.fieldName === '*' || o.fieldName === fieldName).forEach(o => {
            merged[o.settingId] = o.value; // Store the raw value or expression
        });

        return merged;
    }

    /**
     * Resolves a setting value, handling expressions if necessary.
     * For now, expressions are simple string matches or references.
     */
    resolveSetting(settingId: string, settings: Record<string, any>, context: any): any {
        const rawValue = settings[settingId];
        if (typeof rawValue === 'string' && rawValue.startsWith('=')) {
            // Expression logic: e.g., "=Person.EditMode"
            const path = rawValue.substring(1);
            return this.getValueByPath(context, path) ?? settings[path];
        }
        return rawValue;
    }

    private getValueByPath(obj: any, path: string): any {
        if (!obj) return undefined;
        const parts = path.split('.');
        let current = obj;
        for (const part of parts) {
            if (current[part] === undefined) return undefined;
            current = current[part];
        }
        return current;
    }
}
