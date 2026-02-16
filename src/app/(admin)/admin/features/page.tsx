'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { adminApi, AdminFeature } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

const CATEGORIES = [
  { value: 'core', label: 'Core' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'integration', label: 'Integracao' },
  { value: 'team', label: 'Equipe' },
  { value: 'support', label: 'Suporte' },
]

const ICONS = [
  'ChefHat', 'Package', 'DollarSign', 'LayoutDashboard', 'Calculator',
  'BarChart3', 'TrendingUp', 'Headphones', 'Code', 'Users',
  'Webhook', 'Shield', 'Star', 'Zap', 'Globe',
]

interface FeatureFormData {
  slug: string
  name: string
  description: string
  category: string
  icon: string
  isActive: boolean
  sortOrder: number
}

const emptyForm: FeatureFormData = {
  slug: '',
  name: '',
  description: '',
  category: '',
  icon: '',
  isActive: true,
  sortOrder: 0,
}

export default function AdminFeaturesPage() {
  const [features, setFeatures] = useState<AdminFeature[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingFeature, setEditingFeature] = useState<AdminFeature | null>(null)
  const [deletingFeature, setDeletingFeature] = useState<AdminFeature | null>(null)
  const [formData, setFormData] = useState<FeatureFormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const loadFeatures = useCallback(async () => {
    try {
      setLoading(true)
      const res = await adminApi.getFeatures()
      setFeatures(res.data.data)
    } catch (err) {
      toast.error('Erro ao carregar features')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFeatures()
  }, [loadFeatures])

  function openCreateDialog() {
    setEditingFeature(null)
    setFormData({
      ...emptyForm,
      sortOrder: features.length,
    })
    setDialogOpen(true)
  }

  function openEditDialog(feature: AdminFeature) {
    setEditingFeature(feature)
    setFormData({
      slug: feature.slug,
      name: feature.name,
      description: feature.description || '',
      category: feature.category || '',
      icon: feature.icon || '',
      isActive: feature.isActive,
      sortOrder: feature.sortOrder,
    })
    setDialogOpen(true)
  }

  function openDeleteDialog(feature: AdminFeature) {
    setDeletingFeature(feature)
    setDeleteDialogOpen(true)
  }

  async function handleSave() {
    if (!formData.slug || !formData.name) {
      toast.error('Slug e Nome sao obrigatorios')
      return
    }

    setSaving(true)
    try {
      const data = {
        slug: formData.slug,
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category || undefined,
        icon: formData.icon || undefined,
        isActive: formData.isActive,
        sortOrder: formData.sortOrder,
      }

      if (editingFeature) {
        await adminApi.updateFeature(editingFeature.id, data)
        toast.success('Feature atualizada')
      } else {
        await adminApi.createFeature(data)
        toast.success('Feature criada')
      }

      setDialogOpen(false)
      loadFeatures()
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao salvar feature'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deletingFeature) return

    try {
      await adminApi.deleteFeature(deletingFeature.id)
      toast.success('Feature excluida')
      setDeleteDialogOpen(false)
      setDeletingFeature(null)
      loadFeatures()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao excluir feature')
    }
  }

  async function handleToggleActive(feature: AdminFeature) {
    try {
      await adminApi.updateFeature(feature.id, { isActive: !feature.isActive })
      setFeatures((prev) =>
        prev.map((f) => (f.id === feature.id ? { ...f, isActive: !f.isActive } : f))
      )
      toast.success(feature.isActive ? 'Feature desativada' : 'Feature ativada')
    } catch {
      toast.error('Erro ao alterar status')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Features</h1>
          <p className="text-muted-foreground">Gerencie as funcionalidades do sistema</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Feature
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slug</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Planos</TableHead>
                <TableHead className="text-center">Ativo</TableHead>
                <TableHead className="text-center">Ordem</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {features.map((feature) => (
                <TableRow key={feature.id}>
                  <TableCell className="font-mono text-sm">{feature.slug}</TableCell>
                  <TableCell className="font-medium">{feature.name}</TableCell>
                  <TableCell>
                    {feature.category && (
                      <Badge variant="secondary">{feature.category}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {feature.planFeatures?.map((pf) => (
                        <Badge key={pf.planType} variant="outline" className="text-xs">
                          {pf.planType}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      onClick={() => handleToggleActive(feature)}
                      className={`w-10 h-5 rounded-full relative transition-colors ${
                        feature.isActive ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                          feature.isActive ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {feature.sortOrder}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(feature)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(feature)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {features.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma feature cadastrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingFeature ? 'Editar Feature' : 'Nova Feature'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="minha-feature"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                disabled={!!editingFeature}
              />
              <p className="text-xs text-muted-foreground">
                Identificador unico (letras minusculas, numeros, hifens)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Minha Feature"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descricao</Label>
              <Input
                id="description"
                placeholder="Descricao breve da feature"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Icone</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(val) => setFormData({ ...formData, icon: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ICONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        {icon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Ordem</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min={0}
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">Ativo</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingFeature ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir feature?</AlertDialogTitle>
            <AlertDialogDescription>
              A feature <strong>{deletingFeature?.name}</strong> ({deletingFeature?.slug}) sera
              excluida permanentemente. Isso tambem remove ela de todos os planos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
