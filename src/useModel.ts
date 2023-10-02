import type { TModelClass, TModelProps, TModelInstace, TModelError } from '@modelsjs/model';
import { useState, useEffect, useContext } from 'react';
import { ModelState, construct, on, once, getError, getState } from '@modelsjs/model';

import { Config } from './config';
import { ResolverContext } from './Resolver';

export function useModel<C extends TModelClass, P extends TModelProps<C>>(
    Class: C
): TModelInstace<C>
export function useModel<C extends TModelClass, P extends TModelProps<C>>(
    Class: C,
    props: P
): TModelInstace<C>
export function useModel<C extends TModelClass, P extends TModelProps<C>>(
    Class: C,
    safe: boolean
): [TModelInstace<C>, TModelError<C>]
export function useModel<C extends TModelClass, P extends TModelProps<C>>(
    Class: C,
    props: P,
    safe: boolean
): [TModelInstace<C>, TModelError<C>]
export function useModel<C extends TModelClass, P extends TModelProps<C>>(
    Class: C,
    props: P = {} as P,
    safe = false
): any {
    if (typeof props === 'boolean') {
        safe = props;
        props = {} as P;
    }
    
    const { suspense, mutable } = useContext(Config);
    const { resolve } = useContext(ResolverContext);

    const model = resolve(construct(Class, props));

    const [ revision, setRevision ] = useState(-1);
    const [ state, setState ] = useState(getState(model));
    const [ error, setError ] = useState(getError(model));

    useEffect(() => on(model, 'revision', (revision: number) => {
        if (!mutable) {
            setRevision(revision);
        }
        setState(getState(model));
        setError(getError(model));
    }), [ model ]);

    switch (state) {
        case ModelState.Error:
            if (safe) {
                return [model, error];
            } else {
                throw error;
            }
        case ModelState.Ready:
            if (safe) {
                return [model, null];
            } else {
                return model as TModelInstace<C, P>;
            }
        case ModelState.Initial: {
            if (!suspense) {
                throw new Error(`Model ${ model } is not initialized.`);
            }

            throw new Promise((resolve, reject) => {
                once(model, 'state', (state) => {
                    state === ModelState.Ready
                        ? resolve(safe ? [model, null] : model)
                        : safe ? resolve([model, getError(model)]) : reject(getError(model));
                });
            });
        }
    }
}