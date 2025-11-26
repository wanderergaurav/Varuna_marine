import { Dispatch, SetStateAction, type ReactNode } from 'react';

type FilteredColumn<T> = {
  header: string;
  render: (row: T) => string;
  // Optional `useState()` if this column should be filterable
  filter: [string, Dispatch<SetStateAction<string>>]
};

type Props<T> = {
  columns: (
    {
      header: string;
      render: (row: T) => ReactNode
    } | FilteredColumn<T>
  )[];
  resource: {
    data?: T[];
    loading: boolean;
    error?: string;
    refresh: () => void;
  };
};

export const Table = <T,>({columns, resource}: Props<T>) => {
  if (!resource.data) {
    return (
      <p className="text-sm text-slate-500 animate-pulse">
        Loading latest data…
      </p>
    );
  }

  if (resource.error) {
    return (
      <div className="text-sm text-red-600 flex items-center gap-2">
        <span>Could not load data.</span>
        <button
          type="button"
          className="underline"
          onClick={resource.refresh}
        >
          Retry
        </button>
      </div>
    );
  }

  if (resource.data.length === 0) {
    return <p className="text-sm text-slate-500">No records yet.</p>;
  }

  // Get all of the columns that have filters that aren't empty
  const active_filters = columns.filter(column => "filter" in column && column.filter[0]) as FilteredColumn<T>[];

  return (
    <div className="overflow-x-auto">
      <table className={"min-w-full divide-y" + (resource.loading ? " animate-pulse" : "")}>
        <thead>
          <tr>
            {columns.map(column => (
              <th
                key={column.header}
                scope="col"
                className="px-3 py-2 text-left text-sm font-semibold text-slate-700"
              >
                {column.header}
                {"filter" in column
                  && <input
                    className="border"
                    placeholder="filter"
                    value={column.filter[0]}
                    onChange={event => column.filter[1](event.target.value)}
                  />
                }
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {resource.data.filter(
            // Filter the rows for only the ones that match all of the filters
            row => active_filters.every(
              column => column.render(row).toLowerCase().includes(column.filter[0].toLowerCase())
            )
          ).map(
            (row, index) => (
              <tr key={index}>
                {columns.map(column => (
                  <td
                    key={column.header}
                    className="px-3 py-2 text-sm text-slate-600"
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
    );
};

