import type { TModelClass, TModelProps, TModelInstace } from '@modelsjs/model';
import { useState, useEffect, useContext } from 'react';
import { ModelState, construct, on, once, getError, getState } from '@modelsjs/model';

import { Config } from './config';
import { Context } from './Resolver';

export function useModel<C extends TModelClass, P extends TModelProps<TModelInstace<C>>>(
    Class: C,
    props: P
): TModelInstace<C, P> {
    const { suspense, mutable } = useContext(Config);
    const { resolve } = useContext(Context);

    const model = resolve(construct(Class, props));

    const [ revision, setRevision ] = useState(-1);
    const [ state, setState ] = useState(getState(model));
    const [ error, setError ] = useState(getError(model));

    useEffect(() => on(model, 'revision', (revision) => {
        if (!mutable) {
            setRevision(revision);
        }
        setState(getState(model));
        setError(getError(model));
    }), [ model ]);

    switch (state) {
        case ModelState.Error:
            throw error;
        case ModelState.Ready:
            return model as TModelInstace<C, P>;
        case ModelState.Initial: {
            if (!suspense) {
                throw new Error(`Model ${ model } is not initialized.`);
            }

            throw new Promise((resolve, reject) => {
                once(model, 'state', (state) => {
                    state === ModelState.Ready
                        ? resolve(model)
                        : reject(getError(model));
                });
            });
        }
    }
}