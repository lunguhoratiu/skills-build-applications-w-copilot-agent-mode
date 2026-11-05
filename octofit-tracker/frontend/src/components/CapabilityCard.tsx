import { useEffect, useState, type ReactNode } from 'react';

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

// `load` must be stable (module-level) so the effect runs once per mount.
export function useApiData<T>(load: () => Promise<T>): LoadState<T> {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' });
  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    load().then(
      (data) => { if (active) setState({ status: 'success', data }); },
      (error: unknown) => { if (active) setState({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error' }); },
    );
    return () => { active = false; };
  }, [load]);
  return state;
}

type Props<T> = {
  title: string;
  description: string;
  state: LoadState<T[]>;
  emptyText: string;
  children: (items: T[]) => ReactNode;
};

export function CapabilityCard<T>({ title, description, state, emptyText, children }: Props<T>) {
  let body: ReactNode;
  if (state.status === 'loading') body = <p role="status" className="text-muted mb-0">Loading {title.toLowerCase()}…</p>;
  else if (state.status === 'error') body = <div role="alert" className="alert alert-danger mb-0">Unable to load {title.toLowerCase()}. {state.message}</div>;
  else if (state.data.length === 0) body = <p className="text-muted mb-0">{emptyText}</p>;
  else body = children(state.data);
  return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p>{body}</div></section>;
}
