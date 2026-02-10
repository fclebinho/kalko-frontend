'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { settingsApi } from '@/lib/api'
import { Bell, BellOff } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [priceAlerts, setPriceAlerts] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    settingsApi
      .getEmailPreferences()
      .then((res) => setPriceAlerts(res.data.priceAlerts))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = async () => {
    const newValue = !priceAlerts
    setSaving(true)
    try {
      await settingsApi.updateEmailPreferences({ priceAlerts: newValue })
      setPriceAlerts(newValue)
      toast.success(newValue ? 'Alertas de preco ativados' : 'Alertas de preco desativados')
    } catch {
      toast.error('Erro ao atualizar preferencias')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Configurações" description="Configure suas preferências" />

        <Card>
          <CardHeader>
            <CardTitle>Preferencias de Email</CardTitle>
            <CardDescription>
              Controle quais notificacoes voce deseja receber por email
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground text-sm">Carregando...</div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  {priceAlerts ? (
                    <Bell className="h-5 w-5 text-primary" />
                  ) : (
                    <BellOff className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">Alertas de Preco</p>
                    <p className="text-sm text-muted-foreground">
                      Receba email quando o custo de um ingrediente aumentar mais de 10%
                    </p>
                  </div>
                </div>
                <Button
                  variant={priceAlerts ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleToggle}
                  disabled={saving}
                >
                  {priceAlerts ? 'Ativado' : 'Desativado'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  )
}
