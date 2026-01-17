import { ChevronUp, ChevronDown } from 'lucide-react';

export function Table({
  columns,
  data,
  sortBy,
  sortOrder,
  onSort,
  selectable = false,
  selectedIds = [],
  onSelectChange,
  emptyMessage = 'Nenhum registro encontrado.',
}) {
  const handleSort = (column) => {
    if (!column.sortable || !onSort) return;

    const newOrder = sortBy === column.key && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(column.key, newOrder);
  };

  const handleSelectAll = (e) => {
    if (!onSelectChange) return;

    if (e.target.checked) {
      onSelectChange(data.map((row) => row.id));
    } else {
      onSelectChange([]);
    }
  };

  const handleSelectRow = (id) => {
    if (!onSelectChange) return;

    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  };

  const allSelected = data.length > 0 && selectedIds.length === data.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < data.length;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {selectable && (
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => el && (el.indeterminate = someSelected)}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.sortable ? 'cursor-pointer select-none hover:bg-gray-100' : ''
                } ${column.className || ''}`}
                onClick={() => handleSort(column)}
              >
                <div className="flex items-center gap-1">
                  {column.label}
                  {column.sortable && sortBy === column.key && (
                    sortOrder === 'asc' ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-4 py-8 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={row.id}
                className={`hover:bg-gray-50 ${
                  selectedIds.includes(row.id) ? 'bg-blue-50' : ''
                }`}
              >
                {selectable && (
                  <td className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => handleSelectRow(row.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 text-sm text-gray-900 ${column.className || ''}`}
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
