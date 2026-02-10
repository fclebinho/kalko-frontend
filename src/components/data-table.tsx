interface DataTableProps {
  loading: boolean
  empty: boolean
  emptyMessage?: string
  emptyAction?: React.ReactNode
  children: React.ReactNode
}

export function DataTable({ loading, empty, emptyMessage, emptyAction, children }: DataTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      ) : empty ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <p>{emptyMessage || 'Nenhum item encontrado'}</p>
          {emptyAction}
        </div>
      ) : (
        children
      )}
    </div>
  )
}
