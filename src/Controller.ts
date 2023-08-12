import type { Model, TSubscription } from '@modelsjs/model';
import type { TResolver } from '@modelsjs/resolver';
import { ResolverState } from './Resolver';
import { getState, ModelState } from '@modelsjs/model';
import { resolve } from '@modelsjs/resolver';
import { split, transaction, events } from './utils';

type TResolverFields = 'state';

type TLoopAction = () => void | Promise<void>;

type TControllableLoop = {
    start: (action: TLoopAction) => void | Promise<void>;
    promise: Promise<void>;
};

export class ResolverController {
    private readonly models: Set<Model> = new Set();

    private loop: Nullable<TControllableLoop> = null;

    public get promise(): Nullable<Promise<void>> {
        return this.loop?.promise;
    }

    public get state(): ResolverState {
        switch (true) {
            case Boolean(this.loop):
                return ResolverState.Resolving;
            default:
                return ResolverState.Resolved;
        }
    }

    private transaction = transaction(
        [ 'state' ] as TResolverFields[],
        (changes) => changes.forEach(([ field, prev, curr ]) => {
            this.events.notify(field, prev, curr);
        })
    );

    private events = events([ 'state' ] as TResolverFields[]);

    constructor(
        private readonly resolvers: TResolver[]
    ) {
    }

    public subscribe(field: TResolverFields, handler: TSubscription) {
        return this.events.subscribe(field, handler);
    }

    public run() {
        this.update();

        if (!this.loop) {
            return;
        }

        this.loop.start(async () => {
            while (this.loop) {
                await resolve([ ...this.models ], this.resolvers);

                this.update();
            }
        });

    }

    public resolve = <T extends Model>(model: T): T => {
        this.transaction(() => {
            if (isResolvable(model)) {
                resolve.sync([ model ], this.resolvers);
            }

            if (isResolvable(model)) {
                this.models.add(model);
                this.update();
            }
        });

        return model;
    }

    private update() {
        this.transaction(() => {
            const [ , work ] = split([ ...this.models ], isResolvable);

            work.forEach((model) => this.models.delete(model));

            if (!this.models.size) {
                this.loop = null;
            } else {
                this.loop = this.loop || loop();
            }
        });
    }
}

function isResolvable(model: Model) {
    return getState(model) === ModelState.Initial;
}

function loop(): TControllableLoop {
    let start: TControllableLoop['start'] = () => {
    };

    const promise = new Promise<void>((resolve) => {
        start = function(this: TControllableLoop, action) {
            this.promise = this.promise.then(action);
            resolve();
        };
    });

    return { start, promise };
}