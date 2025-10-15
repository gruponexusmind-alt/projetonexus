import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Clock, Loader2 } from 'lucide-react';

interface TimeEntryModalProps {
  taskId: string;
  taskTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TimeEntryModal({
  taskId,
  taskTitle,
  open,
  onOpenChange,
  onSuccess,
}: TimeEntryModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  // Default to today's date
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const [formData, setFormData] = useState({
    startDate: today,
    startTime: currentTime,
    endDate: today,
    endTime: currentTime,
    description: '',
    isBillable: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.id || !profile?.company_id) {
      toast.error('Erro', { description: 'Perfil não encontrado' });
      return;
    }

    // Validate times
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

    if (endDateTime <= startDateTime) {
      toast.error('Data inválida', {
        description: 'A hora de término deve ser posterior à hora de início',
      });
      return;
    }

    // Check if end time is in the future
    if (endDateTime > new Date()) {
      toast.error('Data inválida', {
        description: 'Não é possível registrar tempo no futuro',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('gp_time_entries').insert({
        task_id: taskId,
        user_id: profile.id,
        company_id: profile.company_id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        description: formData.description.trim() || null,
        is_billable: formData.isBillable,
        entry_type: 'manual',
      });

      if (error) throw error;

      const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / 1000 / 60);

      toast.success('Tempo registrado!', {
        description: `${durationMinutes} minutos adicionados à tarefa`,
      });

      // Reset form
      setFormData({
        startDate: today,
        startTime: currentTime,
        endDate: today,
        endTime: currentTime,
        description: '',
        isBillable: false,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao registrar tempo:', error);
      toast.error('Erro ao registrar tempo', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = () => {
    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      if (endDateTime <= startDateTime) return null;

      const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / 1000 / 60);
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;

      if (hours > 0) {
        return `${hours}h ${minutes}min`;
      }
      return `${minutes}min`;
    } catch {
      return null;
    }
  };

  const duration = calculateDuration();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Registrar Tempo Manualmente
            </DialogTitle>
            <DialogDescription>
              {taskTitle ? `Tarefa: ${taskTitle}` : 'Adicione um registro de tempo manual'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Start Date/Time */}
            <div className="space-y-2">
              <Label>Início</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    max={today}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* End Date/Time */}
            <div className="space-y-2">
              <Label>Término</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    max={today}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Duration Display */}
            {duration && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>Duração:</strong> {duration}
                </p>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="O que foi feito nesta sessão?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Is Billable */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_billable"
                checked={formData.isBillable}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isBillable: checked as boolean })
                }
              />
              <Label
                htmlFor="is_billable"
                className="text-sm font-normal cursor-pointer"
              >
                Tempo faturável ao cliente
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !duration}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Registrar Tempo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
