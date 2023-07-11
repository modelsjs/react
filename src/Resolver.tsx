import type { FC, PropsWithChildren, ReactNode } from 'react';
import type { TResolver } from '@modelsjs/resolver';
import React, { createContext, Suspense, useContext } from 'react';
import { getState, Model, ModelState } from '@modelsjs/model';
import { resolve } from '@modelsjs/resolver';

export const Resolving: FC<PropsWithChildren<{}>> = ({ children }) => {
    const resolver = useContext(Context);

    resolver.run();

    if (!resolver.isPending) {
        return null;
    }

    return <>{children}</>;
};

export const Resolver: FC<PropsWithChildren<{
    fallback: ReactNode;
    resolvers: any[]
}>> = ({fallback, resolvers, children}) => {
    return (
        <Context.Provider value={new Controller(resolvers)}>
            <Suspense fallback={<Resolving>{fallback}</Resolving>}>
                {children}
            </Suspense>
        </Context.Provider>

    );
};

class Controller {
    private readonly models: Set<Model> = new Set();

    get isPending() {
        return Boolean(this.models.size);
    }

    constructor(private readonly resolvers: TResolver[]) {}

    public async run() {
        return resolve([...this.models], this.resolvers);
    }

    public resolve = <T extends Model>(model: T): T => {
        resolve.sync([model], this.resolvers);

        if (getState(model) === ModelState.Initial) {
            this.models.add(model);
        }

        return model;
    }
}

export const Context = createContext<Controller>(new Controller([]));

