import { GoogleGenAI, Type } from "@google/genai";
import { ChildProfile, Task, AIResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const FALLBACK_TASKS: Record<string, Task[]> = {
  ru: [
    { type: 'SCHOOL_MATH', question: "У тебя есть 5 яблок, ты съел 2. Сколько осталось?", answer: "3" },
    { type: 'SCHOOL_MATH', question: "2 + 2 * 2 = ?", answer: "6" }
  ],
  en: [
    { type: 'SCHOOL_MATH', question: "You have 5 apples, you ate 2. How many are left?", answer: "3" },
    { type: 'SCHOOL_MATH', question: "2 + 2 * 2 = ?", answer: "6" }
  ]
};

export async function generateTask(profile: ChildProfile): Promise<AIResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === '' || apiKey === 'MY_GEMINI_API_KEY') {
    return {
      task: FALLBACK_TASKS.ru[0],
      error: "AI not configured. Please add MY_OWN_KEY secret in Settings -> Secrets and paste your API key."
    };
  }
  try {
    let prompt = "";
    let responseSchema: any = {};

    if (profile.preferredTaskType === 'SCHOOL_MATH') {
      prompt = `Create a school math problem for a child.
      Grade: ${profile.grade}. Age: ${profile.age}. Interests: ${profile.interests}. Language: ${profile.language}.
      The task must strictly follow the school curriculum for grade ${profile.grade}.
      Return JSON: {"type": "SCHOOL_MATH", "question": "task text", "answer": "number"}`;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          question: { type: Type.STRING },
          answer: { type: Type.STRING }
        },
        required: ["type", "question", "answer"]
      };
    } else if (profile.preferredTaskType === 'LOGIC') {
      prompt = `Create a logic puzzle or brain teaser for a child.
      Age: ${profile.age}. Interests: ${profile.interests}. Language: ${profile.language}.
      The task should be age-appropriate and focus on logical thinking, not just school math.
      Return JSON: {"type": "LOGIC", "question": "puzzle text", "answer": "number or short word"}`;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          question: { type: Type.STRING },
          answer: { type: Type.STRING }
        },
        required: ["type", "question", "answer"]
      };
    } else if (profile.preferredTaskType === 'READING') {
      prompt = `Create a short text for reading aloud.
      Grade: ${profile.grade}. Interests: ${profile.interests}. Language: ${profile.language}.
      The text should be interesting and appropriate for grade ${profile.grade}.
      Return JSON: {"type": "READING", "text": "text to read"}`;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          text: { type: Type.STRING }
        },
        required: ["type", "text"]
      };
    } else {
      prompt = `Create a very short story for the child to retell.
      Grade: ${profile.grade}. Interests: ${profile.interests}. Language: ${profile.language}.
      Return JSON: {"type": "RETELLING", "story": "story to retell"}`;
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          story: { type: Type.STRING }
        },
        required: ["type", "story"]
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema
      }
    });

    const result = JSON.parse(response.text || "{}");
    return { task: result as Task };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const lang = profile.language.toLowerCase().includes('ru') ? 'ru' : 'en';
    const tasks = FALLBACK_TASKS[lang] || FALLBACK_TASKS['en'];
    return { 
      task: tasks[Math.floor(Math.random() * tasks.length)],
      error: error?.message || "Не удалось подключиться к ИИ. Используем запасную задачу."
    };
  }
}

export async function evaluateAudio(base64Audio: string, task: Task, profile: ChildProfile): Promise<{ success: boolean, feedback: string }> {
  try {
    let prompt = "";
    if (task.type === 'READING') {
      prompt = `Прослушай аудиозапись ребенка, который читает этот текст: "${task.text}".
      Ребенок учится в ${profile.grade} классе.
      Оцени, насколько правильно и бегло он прочитал текст.
      Верни JSON: {"success": true/false, "feedback": "короткий отзыв"}`;
    } else if (task.type === 'RETELLING') {
      prompt = `Прослушай пересказ истории: "${task.story}".
      Ребенок учится в ${profile.grade} классе.
      Оцени, понял ли он суть истории и смог ли ее пересказать.
      Верни JSON: {"success": true/false, "feedback": "короткий отзыв"}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { text: prompt },
        { inlineData: { mimeType: "audio/webm", data: base64Audio } }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            success: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING }
          },
          required: ["success", "feedback"]
        }
      }
    });

    return JSON.parse(response.text || '{"success": false, "feedback": "Ошибка оценки"}');
  } catch (error) {
    console.error("Audio Evaluation Error:", error);
    return { success: true, feedback: "ИИ временно недоступен, но ты молодец! (Авто-проверка)" };
  }
}

export async function evaluateTextAnswer(userAnswer: string, task: Task, profile: ChildProfile): Promise<{ success: boolean, feedback: string }> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey === '' || apiKey === 'MY_GEMINI_API_KEY') {
      // Fallback to strict comparison if AI is not configured
      const isCorrect = userAnswer.trim().toLowerCase() === (task as any).answer?.toString().toLowerCase();
      return { success: isCorrect, feedback: isCorrect ? "Correct!" : "Try again!" };
    }

    const prompt = `Evaluate the child's answer to this task.
    Task Type: ${task.type}
    Question: "${(task as any).question}"
    Expected Answer: "${(task as any).answer}"
    Child's Answer: "${userAnswer}"
    Language: ${profile.language}
    
    Is the child's answer correct? Be lenient with typos or slightly different phrasing if the meaning is correct.
    Return JSON: {"success": true/false, "feedback": "short encouraging feedback in ${profile.language}"}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            success: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING }
          },
          required: ["success", "feedback"]
        }
      }
    });

    return JSON.parse(response.text || '{"success": false, "feedback": "Error evaluating answer"}');
  } catch (error) {
    console.error("Text Evaluation Error:", error);
    const isCorrect = userAnswer.trim().toLowerCase() === (task as any).answer?.toString().toLowerCase();
    return { success: isCorrect, feedback: isCorrect ? "Correct!" : "Try again!" };
  }
}
