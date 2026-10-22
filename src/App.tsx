import { useState, useEffect } from "react";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";

type Status = "todo" | "progress" | "done";

type Task = {
  id: string;
  title: string;
  status: Status;
};

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

  if (!title) return;

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
      <h2>{column.title} ({count})</h2>

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
  const [tasks, setTasks] = useState<Task[]>(() => {
  const savedTasks = localStorage.getItem("tasks");

  return savedTasks ? JSON.parse(savedTasks) : [
    { id: "1", title: "Learn React components", status: "todo" },
    { id: "2", title: "Understand useState", status: "progress" },
    { id: "3", title: "Set up the project", status: "done" },
  ];
});

  const [newTask, setNewTask] = useState("");

  useEffect(() => {
   localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);
  
  function addTask() {
    const title = newTask.trim();
    if (!title) return;
    const task: Task = {  
    id: crypto.randomUUID(),
    title,
    status: "todo",
    };
    setTasks((currentTasks) => [...currentTasks, task]);
    setNewTask("");
}

    function deleteTask(id: string) {
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== id)
    );
  }

  function editTask(id: string, title: string) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id ? { ...task, title } : task
      )
    );
  }

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (!over) return;

    const newStatus = String(over.id);

    if (!columns.some((column) => column.id === newStatus)) return;

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === String(active.id)
          ? { ...task, status: newStatus as Status }
          : task
      )
    );
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
          <div className="avatar">O</div>
          <div className="workspace-info">
            <span>My workspace</span>
            <small>Local account</small>
          </div>
        </div>
      </header>

      <div className="add-task">
        <input
          type="text"
          placeholder="Enter a new task..."
          value={newTask}
          onChange={(event) => setNewTask(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              addTask();
            }
          }}
        />


        <button onClick={addTask}>Add Task</button>
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