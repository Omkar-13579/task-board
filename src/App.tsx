
import { useState } from "react";
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

function TaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`task-card ${isDragging ? "dragging" : ""}`}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
    >
      {task.title}
    </div>
  );
}

function TaskColumn({
  column,
  tasks,
}: {
  column: { id: Status; title: string };
  tasks: Task[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <section
      ref={setNodeRef}
      className={`column ${column.id} ${isOver ? "column-over" : ""}`}
    >
      <h2>{column.title}</h2>
      <div className="task-list">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <p className="empty-message">[Drop your task here]</p>
        )}
      </div>
    </section>
  );
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", title: "Learn React components", status: "todo" },
    { id: "2", title: "Understand useState", status: "progress" },
    { id: "3", title: "Set up the project", status: "done" },
  ]);

  const [newTask, setNewTask] = useState("");
  
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
      <h1>My Task Board</h1>
      <p className="subtitle">Organize your work, one task at a time.</p>
      
      <DndContext onDragEnd={handleDragEnd}>
        <div className="board">
          {columns.map((column) => (
            <TaskColumn
              key={column.id}
              column={column}
              tasks={tasks.filter((task) => task.status === column.id)}
            />
          ))}
        </div>
      </DndContext>
    </main>
  );
}

export default App;
