import {createContext, version} from 'react';

export const Config = createContext<{
    suspense: boolean
    mutable: boolean
}>({
    suspense: parseInt(version) >= 18,
    mutable: false
});