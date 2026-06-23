import express from "express";
import { getTasks, createTask, updateTask, deleteTask, suggestTasks } from "../controllers/taskController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.use(protect);

router.get("/", getTasks);
router.post("/", createTask);
router.post("/suggest", suggestTasks);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;
