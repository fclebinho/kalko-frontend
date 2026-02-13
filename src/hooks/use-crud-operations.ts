/**
 * Hook genérico para operações CRUD com cache invalidation
 *
 * Dependency Inversion: Depende de abstrações (API, hooks) não implementações
 * Single Responsibility: Coordena operações CRUD de uma entidade
 * DRY: Elimina duplicação de handlers CRUD em cada página
 * Open/Closed: Extensível via callbacks sem modificar o hook
 *
 * @example
 * ```tsx
 * const ingredients = useCrudOperations({
 *   entityName: 'ingrediente',
 *   useList: useIngredients,
 *   api: {
 *     create: ingredientsApi.create,
 *     update: ingredientsApi.update,
 *     delete: ingredientsApi.delete
 *   },
 *   onMutate: invalidateRecipeCaches
 * })
 *
 * <Button onClick={() => ingredients.create.execute({ name: 'Farinha' })}>
 *   Criar
 * </Button>
 * ```
 */

import { useAsyncOperation } from './use-async-operation'
import { useConfirmDelete } from './use-confirm-delete'

interface CrudApi<TData, TCreateInput = Partial<TData>, TUpdateInput = Partial<TData>> {
  create?: (data: TCreateInput) => Promise<any>
  update?: (id: string, data: TUpdateInput) => Promise<any>
  delete?: (id: string) => Promise<any>
}

interface CrudOperationsOptions<TData, TCreateInput = Partial<TData>, TUpdateInput = Partial<TData>> {
  entityName: string // Ex: 'ingrediente', 'receita'
  api: CrudApi<TData, TCreateInput, TUpdateInput>
  onMutate?: () => void // Callback após qualquer mutação (para invalidar caches)
  getDeleteWarning?: (item: TData) => string | null
  customMessages?: {
    createSuccess?: string
    updateSuccess?: string
    deleteSuccess?: string | ((item: TData) => string)
  }
}

export function useCrudOperations<TData extends { id: string; name?: string }, TCreateInput = Partial<TData>, TUpdateInput = Partial<TData>>(
  options: CrudOperationsOptions<TData, TCreateInput, TUpdateInput>
) {
  const { entityName, api, onMutate, getDeleteWarning, customMessages = {} } = options

  const createOp = useAsyncOperation()
  const updateOp = useAsyncOperation()
  const deleteOp = useAsyncOperation()

  // Create handler
  const create = async (data: TCreateInput) => {
    if (!api.create) throw new Error('Create API not configured')

    return createOp.execute({
      operation: () => api.create!(data),
      successMessage: customMessages.createSuccess || `${capitalize(entityName)} criado com sucesso`,
      onSuccess: () => {
        if (onMutate) onMutate()
      }
    })
  }

  // Update handler
  const update = async (id: string, data: TUpdateInput) => {
    if (!api.update) throw new Error('Update API not configured')

    return updateOp.execute({
      operation: () => api.update!(id, data),
      successMessage: customMessages.updateSuccess || `${capitalize(entityName)} atualizado com sucesso`,
      onSuccess: () => {
        if (onMutate) onMutate()
      }
    })
  }

  // Delete with confirmation
  const confirmDelete = useConfirmDelete<TData>({
    onConfirm: async (item) => {
      if (!api.delete) throw new Error('Delete API not configured')
      await api.delete(item.id)
    },
    successMessage: customMessages.deleteSuccess || ((item) => `${item.name || capitalize(entityName)} excluído com sucesso`),
    getWarningMessage: getDeleteWarning,
    onSuccess: () => {
      if (onMutate) onMutate()
    }
  })

  return {
    create: {
      execute: create,
      isLoading: createOp.isLoading,
      error: createOp.error
    },
    update: {
      execute: update,
      isLoading: updateOp.isLoading,
      error: updateOp.error
    },
    delete: {
      prompt: confirmDelete.prompt,
      isLoading: confirmDelete.isLoading,
      dialogProps: confirmDelete.dialogProps
    }
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
