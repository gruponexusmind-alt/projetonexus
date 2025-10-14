import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  meeting_date: string;
  duration_minutes: number;
  meeting_type: 'internal' | 'client' | 'kickoff' | 'review';
  status: 'scheduled' | 'completed' | 'cancelled';
  meeting_link: string | null;
  notes: string | null;
}

interface CreateMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  companyId: string;
  meeting?: Meeting | null;
  onMeetingCreated: () => void;
}

export function CreateMeetingModal({
  open,
  onOpenChange,
  projectId,
  companyId,
  meeting,
  onMeetingCreated,
}: CreateMeetingModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    meeting_date: '',
    meeting_time: '',
    duration_minutes: 60,
    meeting_type: 'internal' as 'internal' | 'client' | 'kickoff' | 'review',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled',
    meeting_link: '',
    notes: '',
  });

  useEffect(() => {
    if (meeting) {
      // Editing mode
      const meetingDate = new Date(meeting.meeting_date);
      const dateStr = meetingDate.toISOString().split('T')[0];
      const timeStr = meetingDate.toTimeString().slice(0, 5);

      setFormData({
        title: meeting.title,
        description: meeting.description || '',
        meeting_date: dateStr,
        meeting_time: timeStr,
        duration_minutes: meeting.duration_minutes,
        meeting_type: meeting.meeting_type,
        status: meeting.status,
        meeting_link: meeting.meeting_link || '',
        notes: meeting.notes || '',
      });
    } else {
      // Creating mode - reset form
      setFormData({
        title: '',
        description: '',
        meeting_date: '',
        meeting_time: '',
        duration_minutes: 60,
        meeting_type: 'internal',
        status: 'scheduled',
        meeting_link: '',
        notes: '',
      });
    }
  }, [meeting, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.meeting_date || !formData.meeting_time) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Combinar data e hora
      const meetingDateTime = new Date(`${formData.meeting_date}T${formData.meeting_time}:00`);

      const meetingData = {
        project_id: projectId,
        company_id: companyId,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        meeting_date: meetingDateTime.toISOString(),
        duration_minutes: formData.duration_minutes,
        meeting_type: formData.meeting_type,
        status: formData.status,
        meeting_link: formData.meeting_link.trim() || null,
        notes: formData.notes.trim() || null,
      };

      if (meeting) {
        // Update existing meeting
        const { error } = await supabase
          .from('gp_meetings')
          .update(meetingData)
          .eq('id', meeting.id);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Reunião atualizada com sucesso.',
        });
      } else {
        // Create new meeting
        const { error } = await supabase.from('gp_meetings').insert(meetingData);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Reunião criada com sucesso.',
        });
      }

      onMeetingCreated();
    } catch (error) {
      console.error('Erro ao salvar reunião:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a reunião.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{meeting ? 'Editar Reunião' : 'Nova Reunião'}</DialogTitle>
          <DialogDescription>
            {meeting
              ? 'Atualize as informações da reunião'
              : 'Cadastre uma nova reunião do projeto'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Reunião de Kickoff, Alinhamento Semanal..."
              required
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalhes sobre a reunião..."
              rows={2}
            />
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meeting_date">Data *</Label>
              <Input
                id="meeting_date"
                type="date"
                value={formData.meeting_date}
                onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting_time">Hora *</Label>
              <Input
                id="meeting_time"
                type="time"
                value={formData.meeting_time}
                onChange={(e) => setFormData({ ...formData, meeting_time: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Duração, Tipo e Status */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duração (min)</Label>
              <Input
                id="duration"
                type="number"
                min="15"
                max="480"
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.meeting_type}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    meeting_type: value as 'internal' | 'client' | 'kickoff' | 'review',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Interna</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="kickoff">Kickoff</SelectItem>
                  <SelectItem value="review">Revisão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    status: value as 'scheduled' | 'completed' | 'cancelled',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Agendada</SelectItem>
                  <SelectItem value="completed">Realizada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Link da Reunião */}
          <div className="space-y-2">
            <Label htmlFor="meeting_link">Link da Reunião</Label>
            <Input
              id="meeting_link"
              type="url"
              value={formData.meeting_link}
              onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
              placeholder="https://meet.google.com/... ou https://zoom.us/..."
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas / Ata da Reunião</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Resumo, decisões tomadas, próximos passos..."
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Estas notas serão incluídas no export PDF do projeto
            </p>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : meeting ? 'Atualizar' : 'Criar Reunião'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
