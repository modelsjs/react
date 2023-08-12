import { useContext, useState, useMemo } from 'react';
import { ResolverContext } from './Resolver';

export function useResolver() {
    const resolver = useContext(ResolverContext);

    const [state, setState] = useState(resolver.state);

    useMemo(() => resolver.subscribe('state', setState), [ resolver ]);

    return resolver;
}