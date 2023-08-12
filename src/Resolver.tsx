import type { FC, PropsWithChildren, ReactNode } from 'react';
import React, { createContext, Suspense, memo } from 'react';
import { ResolverController } from './Controller';
import { useResolver } from './useResolver';

export enum ResolverState {
    Resolving = 'resolving',

    Resolved = 'resolved'
}

export const Resolver: FC<PropsWithChildren<{
    fallback: ReactNode;
    resolvers: any[]
}>> = memo(({ fallback, resolvers, children }) => {
    return (
        <ResolverContext.Provider value={ new ResolverController(resolvers) }>
            <Suspense fallback={ fallback }>
                { children }
                <Wait/>
            </Suspense>
        </ResolverContext.Provider>
    );
});

export const Wait: FC<PropsWithChildren<{}>> = memo(({ children }) => {
    const resolver = useResolver();

    resolver.run();

    if (resolver.promise) {
        throw resolver.promise;
    }

    return <>{ children }</>;
});

export const ResolverContext = createContext<ResolverController>(new ResolverController([]));
