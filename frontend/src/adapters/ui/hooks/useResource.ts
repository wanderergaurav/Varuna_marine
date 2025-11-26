import { useEffect, useState } from 'react';

type ResourceState<T> = {
  data?: T;
  error?: string;
  loading: boolean;
};

export const useResource = <T>(fetcher: () => Promise<T>) => {
  const [state, setState] = useState<ResourceState<T>>({
    loading: true
  });

  const refresh = () => {
    setState((prev) => ({ ...prev, loading: true, error: undefined }));
    fetcher()
      .then((result) => setState({ data: result, loading: false }))
      .catch((error: Error) =>
        setState({
          error: error.message,
          loading: false
        })
      );
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...state, refresh };
};

