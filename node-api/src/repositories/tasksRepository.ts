import fs from "node:fs";
import path from "node:path";

interface Task {
	id: number;
	text: string;
	summary: string | null;
	lang: string;
}

export class TasksRepository {
	private tasks: Task[] = [];
	private filename = "tasks.json";
	private currentId = 1;

	constructor() {
		this.loadTasks();
	}

	private loadTasks(): void {
		const filePath = path.join(__dirname, this.filename);
		if (fs.existsSync(filePath)) {
			const data = fs.readFileSync(filePath, "utf8");
			this.tasks = JSON.parse(data);
			this.currentId = Math.max(...this.tasks.map((task) => task.id)) + 1;
		}
	}

	private saveTasks(): void {
		const filePath = path.join(__dirname, this.filename);
		fs.writeFileSync(filePath, JSON.stringify(this.tasks, null, 2));
	}

	createTask(text: string, lang: string): Task {
		const task: Task = {
			id: this.currentId++,
			text,
			summary: null,
			lang: lang,
		};
		this.tasks.push(task);
		this.saveTasks();
		return task;
	}

	updateTask(id: number, summary: string): Task | null {
		const taskIndex = this.tasks.findIndex((t) => t.id === id);
		if (taskIndex > -1) {
			this.tasks[taskIndex].summary = summary;
			this.saveTasks();
			return this.tasks[taskIndex];
		}
		return null;
	}

	getTaskById(id: number): Task | null {
		return this.tasks.find((t) => t.id === id) || null;
	}

	getAllTasks(): Task[] {
		return this.tasks;
	}

	deleteTaskById(id: number): void {
		this.tasks = this.tasks.filter((t) => t.id !== id);
		this.saveTasks();
	}
}
