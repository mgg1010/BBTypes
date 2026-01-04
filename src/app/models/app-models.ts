import { BBType } from './bb-types';

export interface AppScreen {
    id: string;
    name: string;
    type: 'list'; // can be extended to 'form', 'dashboard', etc.
    typeId: string; // The BBType ID that this screen is displaying/editing (e.g. for a list)
}

export interface AppConfig {
    name: string;
    slug: string;
    types: BBType[];
    screens: AppScreen[];
}
