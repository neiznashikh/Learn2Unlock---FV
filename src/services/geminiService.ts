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
    
    let errorMessage = error?.message || "Не удалось подключиться к ИИ. Используем запасную задачу.";
    if (errorMessage.includes("429") || errorMessage.includes("quota")) {
      errorMessage = lang === 'ru' 
        ? "Достигнут лимит запросов ИИ (15 в минуту). Подождите 1 минуту или добавьте свой API-ключ в настройках Secrets (MY_GEMINI_API_KEY)."
        : "AI rate limit reached (15/min). Please wait 1 minute or add your own API key in Secrets settings (MY_GEMINI_API_KEY).";
    }

    return { 
      task: tasks[Math.floor(Math.random() * tasks.length)],
      error: errorMessage
    };
  }
}

export async function evaluateAudio(base64Audio: string, task: Task, profile: ChildProfile): Promise<{ success: boolean, feedback: string }> {
  try {
    let prompt = "";
    if (task.type === 'READING') {
      prompt = `
        Ты - добрый и помогающий учитель. Прослушай аудиозапись ребенка (возраст: ${profile.age}, класс: ${profile.grade}), который читает текст: "${task.text}".
        
        Критерии оценки:
        1. Насколько точно прочитаны слова.
        2. Беглость и интонация (соответственно возрасту).
        
        Будь лоялен к детским ошибкам и небольшим запинкам. Если ребенок в целом справился с текстом, ставь "success": true.
        
        Обязательно верни ответ в формате JSON на языке ${profile.language}:
        {"success": true/false, "feedback": "короткий подбадривающий отзыв (макс 2 предложения)"}`;
    } else if (task.type === 'RETELLING') {
      prompt = `
        Ты - добрый учитель. Прослушай пересказ ребенка (возраст: ${profile.age}, класс: ${profile.grade}) истории: "${task.story}".
        
        Критерии оценки:
        1. Понял ли ребенок смысл истории?
        2. Упомянул ли он ключевые моменты?
        
        Будь лоялен. Если суть передана верно, ставь "success": true.
        
        Обязательно верни ответ в формате JSON на языке ${profile.language}:
        {"success": true/false, "feedback": "короткий подбадривающий отзыв (макс 2 предложения)"}`;
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

    const responseText = response.text || "";
    try {
      return JSON.parse(responseText);
    } catch (e) {
      console.error("JSON Parse Error in evaluateAudio:", responseText);
      // Fallback if AI returned non-JSON despite schema
      if (responseText.toLowerCase().includes('"success": true') || responseText.toLowerCase().includes('true')) {
        return { success: true, feedback: "Молодец! Отличное старание!" };
      }
      return { success: false, feedback: "Попробуй еще раз, я верю в тебя!" };
    }
  } catch (error: any) {
    console.error("Audio Evaluation Error:", error);
    // If it's a model error or format error, we might want to be lenient in a "lock" app so the child isn't stuck
    if (error?.message?.includes('format') || error?.message?.includes('support')) {
      return { success: true, feedback: "Я услышал тебя! Ты молодец!" };
    }
    return { success: true, feedback: "Отлично! Продолжаем!" }; // Default to success if AI fails to avoid trapping the child
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
