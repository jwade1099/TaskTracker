"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { suggestTags } from "@/ai/flows/suggest-tags";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle, Plus, Tag, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface Task {
  id: string;
  title: string;
  description: string;
  tags: string[];
  dueDate?: string; // Store date as ISO string
  completed: boolean;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

const initialColumns: Column[] = [
  {
    id: 'todo',
    title: 'To Do',
    tasks: [
      { id: '1', title: 'Plan TaskFlow Kanban', description: 'Define project scope and features.', tags: ['planning'], dueDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), completed: false },
      { id: '2', title: 'Set up Next.js project', description: 'Initialize project with necessary dependencies.', tags: ['setup', 'nextjs'], dueDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(), completed: false },
    ],
  },
  {
    id: 'inprogress',
    title: 'In Progress',
    tasks: [
      { id: '3', title: 'Implement drag and drop', description: 'Enable task movement between columns.', tags: ['drag-and-drop', 'ui'], dueDate: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(), completed: false },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    tasks: [
      { id: '4', title: 'Design UI components', description: 'Create basic UI elements.', tags: ['ui', 'design'], dueDate: new Date(new Date().setDate(new Date().getDate() + 4)).toISOString(), completed: true },
    ],
  },
];

export default function Home() {
  const [columns, setColumns] = useState(initialColumns);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [hydrated, setHydrated] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleTagSuggestion = async () => {
    if (selectedTask) {
      const { tags } = await suggestTags({ description: taskDescription });
      setSuggestedTags(tags);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTaskDescription(e.target.value);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskDescription(task.description);
    setSelectedDate(task.dueDate ? new Date(task.dueDate) : undefined);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedTask(null);
  };

  const handleSaveDescription = () => {
    if (selectedTask) {
      const newColumns = columns.map(column => ({
        ...column,
        tasks: column.tasks.map(task =>
          task.id === selectedTask.id ? {
            ...task,
            description: taskDescription,
            dueDate: selectedDate ? selectedDate.toISOString() : undefined
          } : task
        ),
      }));
      setColumns(newColumns);
    }
    setDialogOpen(false);
    setSelectedTask(null);
  };

  const handleAddTag = () => {
    if (selectedTask && newTag.trim() !== '') {
      const newColumns = columns.map(column => ({
        ...column,
        tasks: column.tasks.map(task =>
          task.id === selectedTask.id ? { ...task, tags: [...task.tags, newTag.trim()] } : task
        ),
      }));
      setColumns(newColumns);
      setNewTag('');
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    if (selectedTask) {
      const newColumns = columns.map(column => ({
        ...column,
        tasks: column.tasks.map(task =>
          task.id === selectedTask.id ? {
            ...task,
            tags: task.tags.filter(tag => tag !== tagToDelete)
          } : task
        ),
      }));
      setColumns(newColumns);
    }
  };

  const handleDragStart = (task: Task, columnId: string) => {
    setDraggingTask(task);
    setDraggingColumnId(columnId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (columnId: string) => {
    if (!draggingTask || !draggingColumnId) return;

    const updatedTask = {
      ...draggingTask,
      completed: columnId === 'done',
    };

    const sourceColumn = columns.find(col => col.id === draggingColumnId);
    const destinationColumn = columns.find(col => col.id === columnId);

    if (!sourceColumn || !destinationColumn) return;

    const updatedSourceTasks = sourceColumn.tasks.filter(task => task.id !== draggingTask.id);
    const updatedDestinationTasks = [...destinationColumn.tasks, updatedTask];

    const newColumns = columns.map(col => {
      if (col.id === draggingColumnId) {
        return { ...col, tasks: updatedSourceTasks };
      }
      if (col.id === columnId) {
        return { ...col, tasks: updatedDestinationTasks };
      }
      return col;
    });

    setColumns(newColumns);
    setDraggingTask(null);
    setDraggingColumnId(null);
  };

  const isDoneSatisfying = (column: Column) => {
    if (column.id !== 'done') return false;
    return column.tasks.every(task => task.completed);
  };

  const handleTaskCompletionToggle = (taskToToggle: Task) => {
    const newColumns = columns.map(column => ({
      ...column,
      tasks: column.tasks.map(task =>
        task.id === taskToToggle.id ? { ...task, completed: !task.completed } : task
      ),
    }));
    setColumns(newColumns);
  };

  const handleCreateNewTask = (title: string) => {
    if (!title || title.trim() === '') {
      alert('Please enter a task title.');
      return;
    }

    const newTask: Task = {
      id: Math.random().toString(36).substring(2, 15), // Generate a random ID
      title: title,
      description: '',
      tags: [],
      dueDate: new Date().toISOString(),
      completed: false,
    };

    const newColumns = columns.map(col => {
      if (col.id === 'todo') {
        return { ...col, tasks: [...col.tasks, newTask] };
      }
      return col;
    });

    setColumns(newColumns);
  };

  if (!hydrated) {
    return null;
  }

  const handleAddTaskClick = () => {
    const title = prompt("Enter task title:");
    if (title) {
      handleCreateNewTask(title);
    }
  };

  return (
    <div className="flex sm:flex-row flex-col h-screen bg-background p-4">
      {columns.map((column) => (
        <div
          key={column.id}
          className="sm:w-1/4 w-full p-2"
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(column.id)}
        >
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">
              {column.title}
              {column.id === 'done' && isDoneSatisfying(column) && ' 🎉'}
            </h2>
          </div>
          {column.tasks.map((task) => (
            <div
              key={task.id}
              className="mb-2"
              draggable={!isMobile}
              onDragStart={isMobile ? undefined : () => handleDragStart(task, column.id)}
              onClick={() => handleTaskClick(task)}
            >
              <Card>
                <CardHeader>
                  <CardTitle>
                    {task.completed ? (
                      <CheckCircle className="mr-2 inline-block h-5 w-5 text-green-500" />
                    ) : null}
                    {task.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{task.description.substring(0, 50)}...</CardDescription>
                  {task.dueDate && (
                    <div className="text-sm text-muted-foreground mt-2">
                      Due Date: {format(new Date(task.dueDate), 'MM/dd/yyyy')}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {task.tags.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ))}

      <Button
        className="fixed bottom-4 right-4 rounded-full bg-teal-500 text-white hover:bg-teal-700"
        onClick={handleAddTaskClick}
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedTask?.title}</DialogTitle>
            <DialogDescription>Edit the task description and manage tags here.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="description" className="text-right inline-block w-32 font-bold">Description</label>
              <Textarea
                id="description"
                value={taskDescription}
                onChange={handleDescriptionChange}
              />
            </div>
            <div className="grid gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    {selectedDate ? (
                      format(selectedDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" side="bottom">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) =>
                      date < new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Button type="button" variant="secondary" onClick={handleTagSuggestion}>
                Suggest Tags with AI
              </Button>
              {suggestedTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {suggestedTags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
            {selectedTask && (
              <div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="New tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                  />
                  <Button type="button" size="sm" onClick={handleAddTag}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tag
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedTask.tags.map((tag) => (
                    <div key={tag} className="inline-flex items-center mr-2 mt-1">
                      <Badge>{tag}</Badge>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 p-0 ml-1"
                        onClick={() => handleDeleteTag(tag)}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove tag</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSaveDescription}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
