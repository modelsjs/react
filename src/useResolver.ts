import { useContext } from 'react';
import { ResolverContext } from './Resolver';

export function useResolver() {
    return useContext(ResolverContext);
}