
import { useState, useEffect } from "react";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import AuthForm from "./AuthForm";
import { authClient } from "./auth-client";

type Status = "todo" | "progress" | "done";

type Task = {
  id: string;
  title: string;
  status: Status;
};

const API_URL = "http://localhost:3000/api/tasks";

const columns: { id: Status; title: string }[] = [
  { id: "todo", title: "To Do" },
  { id: "progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

function TaskCard({
  task,
  onDelete,
  onEdit,
}: {
  task: Task;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id });

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);

  function saveTitle() {
    const title = editedTitle.trim();

    if (!title || title === task.title) {
      setEditedTitle(task.title);
      setIsEditing(false);
      return;
    }

    onEdit(task.id, title);
    setIsEditing(false);
  }

  function cancelEdit() {
    setEditedTitle(task.title);
    setIsEditing(false);
  }

  return (
    <div
      {...listeners}
      {...attributes}
      ref={setNodeRef}
      className={`task-card ${isDragging ? "dragging" : ""}`}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
    >
      <div className="task-title-row">
        {isEditing ? (
          <input
            className="edit-input"
            value={editedTitle}
            onChange={(event) => setEditedTitle(event.target.value)}
            onPointerDown={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Enter") saveTitle();
              if (event.key === "Escape") cancelEdit();
            }}
            autoFocus
          />
        ) : (
          <div className="task-title">{task.title}</div>
        )}

        <div className="task-icon-actions">
          <button
            type="button"
            className="icon-button"
            title={isEditing ? "Save task" : "Edit task"}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();

              if (isEditing) {
                saveTitle();
              } else {
                setEditedTitle(task.title);
                setIsEditing(true);
              }
            }}
          >
            {isEditing ? "✓" : "✎"}
          </button>

          <button
            type="button"
            className="icon-button delete-icon"
            title="Delete task"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onDelete(task.id);
            }}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskColumn({
  column,
  tasks,
  onDelete,
  onEdit,
  count,
}: {
  column: { id: Status; title: string };
  tasks: Task[];
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string) => void;
  count: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <section
      ref={setNodeRef}
      className={`column ${column.id} ${isOver ? "column-over" : ""}`}
    >
      <h2>
        {column.title} ({count})
      </h2>

      <div className="task-list">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        ))}

        {tasks.length === 0 && (
          <p className="empty-message">Drop your task here</p>
        )}
      </div>
    </section>
  );
}

function App() {
  const { data: session, isPending } = authClient.useSession();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [tasksLoading, setTasksLoading] = useState(true);
  const [taskError, setTaskError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      setTasks([]);
      setTasksLoading(false);
      return;
    }

    let cancelled = false;

    async function loadTasks() {
      setTasksLoading(true);
      setTaskError("");

      try {
        const response = await fetch(API_URL, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? "Your session expired. Please log in again."
              : "Could not load tasks."
          );
        }

        const data: Task[] = await response.json();

        if (!cancelled) {
          setTasks(data);
        }
      } catch (error) {
        if (!cancelled) {
          setTaskError(
            error instanceof Error
              ? error.message
              : "Could not connect to the backend."
          );
        }
      } finally {
        if (!cancelled) {
          setTasksLoading(false);
        }
      }
    }

    void loadTasks();

    return () => {
      cancelled = true;
    };
  }, [session, isPending]);

  async function addTask() {
    const title = newTask.trim();

    if (!title || saving) return;

    setSaving(true);
    setTaskError("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, status: "todo" }),
      });

      if (!response.ok) {
        throw new Error("Could not add task.");
      }

      const task: Task = await response.json();

      setTasks((current) => [...current, task]);
      setNewTask("");
    } catch (error) {
      setTaskError(
        error instanceof Error ? error.message : "Could not add task."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteTask(id: string) {
    setTaskError("");

    try {
      const response = await fetch(
        `${API_URL}/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Could not delete task.");
      }

      setTasks((current) => current.filter((task) => task.id !== id));
    } catch (error) {
      setTaskError(
        error instanceof Error ? error.message : "Could not delete task."
      );
    }
  }

  async function editTask(id: string, title: string) {
    setTaskError("");

    try {
      const response = await fetch(
        `${API_URL}/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        }
      );

      if (!response.ok) {
        throw new Error("Could not edit task.");
      }

      setTasks((current) =>
        current.map((task) =>
          task.id === id ? { ...task, title } : task
        )
      );
    } catch (error) {
      setTaskError(
        error instanceof Error ? error.message : "Could not edit task."
      );
    }
  }

  async function handleDragEnd(event: any) {
    const { active, over } = event;

    if (!over) return;

    const newStatus = String(over.id);

    if (!columns.some((column) => column.id === newStatus)) return;

    const task = tasks.find((item) => item.id === String(active.id));

    if (!task || task.status === newStatus) return;

    setTaskError("");

    try {
      const response = await fetch(
        `${API_URL}/${encodeURIComponent(task.id)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Could not move task.");
      }

      setTasks((current) =>
        current.map((item) =>
          item.id === task.id
            ? { ...item, status: newStatus as Status }
            : item
        )
      );
    } catch (error) {
      setTaskError(
        error instanceof Error ? error.message : "Could not move task."
      );
    }
  }

  if (isPending) {
    return <p>Loading...</p>;
  }

  if (!session) {
    return <AuthForm />;
  }

  return (
    <main>
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-icon">✓</div>

          <div>
            <h1>TaskFlow</h1>
            <p>Organize your work, one task at a time.</p>
          </div>
        </div>

        <div className="workspace-badge">
          <div className="avatar">
            {session.user.name?.charAt(0).toUpperCase() || "U"}
          </div>

          <div className="workspace-info">
            <span>{session.user.name || "My workspace"}</span>
            <small>{session.user.email}</small>
          </div>

          <button
            className="logout-button"
            onClick={() => void authClient.signOut()}
          >
            Log out
          </button>
        </div>
      </header>

      {tasksLoading && <p>Loading tasks...</p>}

      {taskError && (
        <p role="alert" className="auth-error">
          {taskError}
        </p>
      )}

      <div className="add-task">
        <input
          type="text"
          placeholder="Enter a new task..."
          value={newTask}
          onChange={(event) => setNewTask(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void addTask();
            }
          }}
        />

        <button onClick={() => void addTask()} disabled={saving}>
          {saving ? "Adding..." : "Add Task"}
        </button>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="board">
          {columns.map((column) => {
            const columnTasks = tasks.filter(
              (task) => task.status === column.id
            );

            return (
              <TaskColumn
                key={column.id}
                column={column}
                tasks={columnTasks}
                onDelete={deleteTask}
                onEdit={editTask}
                count={columnTasks.length}
              />
            );
          })}
        </div>
      </DndContext>
    </main>
  );
}

export default App;