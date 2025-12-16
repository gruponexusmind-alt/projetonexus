import { useState, useEffect } from 'react';
import { CalendarIcon, User, Tags, Paperclip, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { StatusIcon, TaskStatus, STATUS_CONFIG, ALL_STATUSES } from './StatusIcon';
import { PriorityIcon, TaskPriority, PRIORITY_CONFIG, ALL_PRIORITIES } from './PriorityIcon';
import { TaskAttachmentUpload } from '@/components/TaskAttachmentUpload';
import { generateUniqueFileName } from '@/utils/fileValidation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Label {
  id: string;
  name: string;
  color: string;
}

interface User {
  id: string;
  nome: string;
}

interface QuickCreateTaskProps {
  projectId: string;
  companyId: string;
  onTaskCreated?: () => void;
  children: React.ReactNode;
  defaultStatus?: TaskStatus;
}

export function QuickCreateTask({
  projectId,
  companyId,
  onTaskCreated,
  children,
  defaultStatus = 'backlog',
}: QuickCreateTaskProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('none');
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [selectedLabels, setSelectedLabels] = useState<Label[]>([]);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);

  // Data
  const [users, setUsers] = useState<User[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);

  // Popover states
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadUsers();
      loadLabels();
    }
  }, [open, companyId]);

  useEffect(() => {
    setStatus(defaultStatus);
  }, [defaultStatus]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadLabels = async () => {
    try {
      const { data, error } = await supabase
        .from('gp_labels')
        .select('id, name, color')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      setLabels(data || []);
    } catch (error) {
      console.error('Error loading labels:', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatus(defaultStatus);
    setPriority('none');
    setAssignedTo(null);
    setSelectedLabels([]);
    setDueDate(undefined);
    setAttachmentFiles([]);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Create task
      const { data: taskData, error: taskError } = await supabase
        .from('gp_tasks')
        .insert({
          project_id: projectId,
          company_id: companyId,
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          assigned_to: assignedTo,
          due_date: dueDate?.toISOString().split('T')[0] || null,
          start_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Add labels
      if (selectedLabels.length > 0 && taskData) {
        const labelInserts = selectedLabels.map((label) => ({
          task_id: taskData.id,
          label_id: label.id,
        }));

        await supabase.from('gp_task_labels').insert(labelInserts);
      }

      // Upload attachments
      if (attachmentFiles.length > 0 && taskData) {
        const { data: userData } = await supabase.auth.getUser();

        if (userData.user) {
          for (const file of attachmentFiles) {
            const uniqueFileName = generateUniqueFileName(file.name);
            const filePath = `${companyId}/${taskData.id}/${uniqueFileName}`;

            const { error: uploadError } = await supabase.storage
              .from('task-attachments')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
              });

            if (uploadError) {
              console.error('Upload error:', uploadError);
              continue;
            }

            await supabase.from('gp_task_attachments').insert({
              task_id: taskData.id,
              company_id: companyId,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              mime_type: file.type,
              uploaded_by: userData.user.id,
            });
          }
        }
      }

      toast({
        title: 'Task created',
        description: 'Your task has been created successfully.',
      });

      resetForm();
      setOpen(false);
      onTaskCreated?.();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleLabel = (label: Label) => {
    setSelectedLabels((prev) => {
      const exists = prev.find((l) => l.id === label.id);
      if (exists) {
        return prev.filter((l) => l.id !== label.id);
      }
      return [...prev, label];
    });
  };

  const selectedUser = users.find((u) => u.id === assignedTo);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">New Issue</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <Input
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-medium border-0 px-0 focus-visible:ring-0 placeholder:text-muted-foreground/60"
            autoFocus
          />

          {/* Description */}
          <Textarea
            placeholder="Add description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[100px] resize-none border-0 px-0 focus-visible:ring-0 placeholder:text-muted-foreground/60"
          />

          {/* Selected Labels */}
          {selectedLabels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedLabels.map((label) => (
                <Badge
                  key={label.id}
                  variant="secondary"
                  className="flex items-center gap-1"
                  style={{
                    backgroundColor: `${label.color}20`,
                    borderColor: label.color,
                    color: label.color,
                  }}
                >
                  {label.name}
                  <button
                    onClick={() => toggleLabel(label)}
                    className="ml-1 hover:opacity-70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 flex-wrap border-t pt-4">
            {/* Status */}
            <Popover open={statusOpen} onOpenChange={setStatusOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2">
                  <StatusIcon status={status} size="sm" />
                  <span>{STATUS_CONFIG[status].label}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1" align="start">
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStatus(s);
                      setStatusOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md',
                      'hover:bg-muted/80',
                      s === status && 'bg-muted'
                    )}
                  >
                    <StatusIcon status={s} size="sm" />
                    <span>{STATUS_CONFIG[s].label}</span>
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {/* Priority */}
            <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2">
                  <PriorityIcon priority={priority} size="sm" />
                  <span>{PRIORITY_CONFIG[priority].label}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-1" align="start">
                {ALL_PRIORITIES.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setPriority(p);
                      setPriorityOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md',
                      'hover:bg-muted/80',
                      p === priority && 'bg-muted'
                    )}
                  >
                    <PriorityIcon priority={p} size="sm" />
                    <span>{PRIORITY_CONFIG[p].label}</span>
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {/* Assignee */}
            <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2">
                  <User className="h-4 w-4" />
                  <span>{selectedUser?.nome || 'Assignee'}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search users..." />
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setAssignedTo(null);
                        setAssigneeOpen(false);
                      }}
                    >
                      <span className="text-muted-foreground">Unassigned</span>
                    </CommandItem>
                    {users.map((user) => (
                      <CommandItem
                        key={user.id}
                        onSelect={() => {
                          setAssignedTo(user.id);
                          setAssigneeOpen(false);
                        }}
                      >
                        {user.nome}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Labels */}
            <Popover open={labelsOpen} onOpenChange={setLabelsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2">
                  <Tags className="h-4 w-4" />
                  <span>
                    {selectedLabels.length > 0
                      ? `${selectedLabels.length} labels`
                      : 'Labels'}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search labels..." />
                  <CommandEmpty>No labels found.</CommandEmpty>
                  <CommandGroup>
                    {labels.map((label) => (
                      <CommandItem
                        key={label.id}
                        onSelect={() => toggleLabel(label)}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: label.color }}
                          />
                          <span className="flex-1">{label.name}</span>
                          {selectedLabels.find((l) => l.id === label.id) && (
                            <span className="text-primary">✓</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Due Date */}
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    {dueDate
                      ? format(dueDate, 'PP', { locale: ptBR })
                      : 'Due date'}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date);
                    setDateOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Attachments */}
            <Popover open={attachmentsOpen} onOpenChange={setAttachmentsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2">
                  <Paperclip className="h-4 w-4" />
                  <span>
                    {attachmentFiles.length > 0
                      ? `${attachmentFiles.length} files`
                      : 'Attach'}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <TaskAttachmentUpload
                  onFilesSelected={(files) => {
                    setAttachmentFiles((prev) => [...prev, ...files]);
                  }}
                  uploading={false}
                  disabled={loading}
                />
                {attachmentFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {attachmentFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="truncate flex-1">{file.name}</span>
                        <button
                          onClick={() => {
                            setAttachmentFiles((prev) =>
                              prev.filter((_, i) => i !== index)
                            );
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Create Button */}
            <Button onClick={handleSubmit} disabled={loading || !title.trim()}>
              {loading ? 'Creating...' : 'Create task'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
