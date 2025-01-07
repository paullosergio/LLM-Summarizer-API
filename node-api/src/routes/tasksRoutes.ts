import dotenv from "dotenv";
import { type Request, type Response, Router } from "express";
import { TasksRepository } from "../repositories/tasksRepository";
dotenv.config();

const router = Router();
const tasksRepository = new TasksRepository();

enum Language {
	PORTUGUESE = "pt",
	ENGLISH = "en",
	SPANISH = "es",
}

const { PYTHON_LLM_URL } = process.env;
if (!PYTHON_LLM_URL) {
	throw new Error("A variável de ambiente PYTHON_LLM_URL não está definida.");
}
async function getSummary(PYTHON_LLM_URL: string, text: string, lang: Language) {
	const response = await fetch(`${PYTHON_LLM_URL}/summarize/`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ text, lang }),
	});
	const data = await response.json();
	return data.summary;
}

// POST: Cria uma tarefa e solicita resumo ao serviço Python
router.post("/", async (req: Request, res: Response) => {
	try {
		const { text, lang } = req.body;

		if (!text) {
			return res.status(400).json({ error: 'Campo "text" é obrigatório.' });
		}

		if (!Object.values(Language).includes(lang as Language)) {
			return res.status(400).json({ error: "Language not supported." });
		}
		// Cria a "tarefa"
		const task = tasksRepository.createTask(text, lang);

		// Deve solicitar o resumo do texto ao serviço Python
		const summary = await getSummary(PYTHON_LLM_URL, text, lang);

		// Atualiza a tarefa com o resumo
		tasksRepository.updateTask(task.id, summary);

		return res.status(201).json({
			message: "Tarefa criada com sucesso!",
			task: tasksRepository.getTaskById(task.id),
		});
	} catch (error) {
		console.error("Erro ao criar tarefa:", error);
		return res
			.status(500)
			.json({ error: "Ocorreu um erro ao criar a tarefa." });
	}
});

// GET: Lista todas as tarefas
router.get("/", (req, res) => {
	const tasks = tasksRepository.getAllTasks();
	return res.json(tasks);
});

// GET: Lista a tarefa por ID
router.get("/:id", (req, res) => {
	const { id } = req.params;
	const task = tasksRepository.getTaskById(Number(id));
	if (!task) {
		return res.status(404).json({ error: "Tarefa não encontrada." });
	}
	return res.json(task);
});

// DELETE: Deleta a tarefa por ID
router.delete("/:id", (req, res) => {
	const { id } = req.params;
	const task = tasksRepository.getTaskById(Number(id));
	if (!task) {
		return res.status(404).json({ error: "Tarefa não encontrada." });
	}
	tasksRepository.deleteTaskById(Number(id));
	return res.json({ message: "Tarefa deletada com sucesso." });
});
export default router;
