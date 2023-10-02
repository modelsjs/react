import type { PropsWithChildren, ReactNode } from 'react';
import React, { createContext, Suspense, memo } from 'react';
import { Resolver as ResolverController, ResolverState } from '@modelsjs/resolver';
import { useResolver } from './useResolver';

export const Resolver = memo<PropsWithChildren<{
    fallback: ReactNode;
    resolvers: any[]
}>>(({ fallback, resolvers, children }) => {
    return (
        <ResolverContext.Provider value={ new ResolverController(resolvers) }>
            <Suspense fallback={ fallback }>
                { children }
                <Wait/>
            </Suspense>
        </ResolverContext.Provider>
    );
});

export const Wait = memo<PropsWithChildren>(({ children }) => {
    const resolver = useResolver();

    if (resolver.state !== ResolverState.Resolving) {
        resolver.run();
    }

    if (resolver.promise) {
        // TODO: implement debug log
        resolver.promise.catch((error) => console.log(error));

        throw resolver.promise;
    }

    return <>{ children }</>;
});

export const ResolverContext = createContext<ResolverController>(new ResolverController([]));
