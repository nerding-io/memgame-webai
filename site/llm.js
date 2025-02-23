import {
  FilesetResolver,
  LlmInference,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai";
import FileProxyCache from "https://cdn.jsdelivr.net/gh/jasonmayes/web-ai-model-proxy-cache@main/FileProxyCache.min.js";
import { KokoroTTS } from "https://cdn.jsdelivr.net/npm/kokoro-js@1.1.1/dist/kokoro.web.js";

// Add near the top with other DOM references
const fileInput = document.getElementById("fileInput");
const promptInput = document.getElementById("promptInput");

export class GameLLM {
  constructor() {
    this.tts = new KokoroTTS();
    this.loadingCallback = null;
    this.isReady = false;
  }

  async init(loadingCallback) {
    if (this.isReady) return;

    this.loadingCallback = loadingCallback;
    await this.initLLM();
    this.isReady = true;
    loadingCallback?.("Model loaded successfully!");
  }

  async initLLM() {
    try {
      this.loadingCallback?.("Initializing LLM...");
      const genai = await FilesetResolver.forGenAiTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@latest/wasm"
      );

      const modelFileNameLocal = "gemma2-2b-it-gpu-int8.bin";
      const modelFileNameRemote =
        "https://storage.googleapis.com/jmstore/WebAIDemos/models/Gemma2/gemma2-2b-it-gpu-int8.bin";

      const fileProgressCallback = (status) => {
        console.log("File progress:", status);
        this.loadingCallback?.(status);
      };

      let dataUrl = await FileProxyCache.loadFromURL(
        modelFileNameLocal,
        fileProgressCallback
      );
      if (!dataUrl) {
        dataUrl = await FileProxyCache.loadFromURL(
          modelFileNameRemote,
          fileProgressCallback
        );
      }

      this.llm = await LlmInference.createFromOptions(genai, {
        baseOptions: {
          modelAssetPath: dataUrl,
        },
        maxTokens: 8000,
        topK: 1,
        temperature: 0.01,
      });

      this.loadingCallback?.("LLM initialized successfully");
    } catch (error) {
      this.loadingCallback?.(`LLM initialization error: ${error.message}`);
      throw error;
    }
  }

  async generateCategoryPairs(category) {
    this.loadingCallback?.("Generating pairs for " + category);

    const prompt = `Create a memory card game about ${category}.
Return a single JSON object with exactly 6 unique pairs in this format:
{
  "pairs": [
    {"front": "first term", "back": "matching answer", "explanation": "why they match"},
    {"front": "second term", "back": "matching answer", "explanation": "why they match"}
    // ... total of 6 pairs
  ]
}`;

    console.log("Prompt:", prompt);

    try {
      let response = await this.llm.generateResponse(prompt);
      console.log("Raw LLM response:", response);

      if (!response) {
        throw new Error("Empty response from LLM");
      }

      // Convert to string and normalize newlines
      response = response.toString().replace(/\r\n/g, "\n");

      // Remove code block markers and empty lines
      let cleanResponse = response
        .replace(/^```[\s\S]*?\n/, "") // Remove opening code block
        .replace(/\n```$/, "") // Remove closing code block
        .replace(/^\s*\n/gm, "") // Remove empty lines
        .trim();

      try {
        // Try direct parse first
        const data = JSON.parse(cleanResponse);
        if (
          !data.pairs ||
          !Array.isArray(data.pairs) ||
          data.pairs.length !== 6
        ) {
          throw new Error("Invalid response format: need exactly 6 pairs");
        }
        return data.pairs;
      } catch (parseError) {
        // If direct parse fails, try to extract JSON
        const jsonMatch = cleanResponse.match(/(\{[\s\S]*\})/);
        if (!jsonMatch) {
          throw new Error("No JSON object found in response");
        }
        const data = JSON.parse(jsonMatch[1]);
        if (
          !data.pairs ||
          !Array.isArray(data.pairs) ||
          data.pairs.length !== 6
        ) {
          throw new Error("Invalid response format: need exactly 6 pairs");
        }
        return data.pairs;
      }
    } catch (error) {
      console.error("Failed to parse LLM response:", error);
      console.error("Cleaned response was:", cleanResponse); // Debug output
      return [
        {
          front: category,
          back: "Try again",
          explanation: "Something went wrong generating pairs",
        },
      ];
    }
  }

  async speak(text) {
    await this.tts.speak(text);
  }
}

function setupFileReader() {
  const dropZone = document.getElementById("dropZone");
  const customPrompt = document.getElementById("customPrompt");

  // File input change handler
  fileInput.addEventListener("change", handleFile);

  // Drag and drop handlers
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove("dragover");

    const file = e.dataTransfer.files[0];
    console.log("Dropped file:", file);
    handleFile({ target: { files: [file] } });
  });

  // Click handler for the drop zone
  dropZone.addEventListener("click", () => {
    fileInput.click();
  });
}

function handleFile(e) {
  const file = e.target.files[0];
  if (!file) {
    console.log("No file selected");
    return;
  }

  console.log("Processing file:", file.name, "type:", file.type);

  const reader = new FileReader();
  reader.onload = (e) => {
    console.log("File read successfully");
    const content = e.target.result;
    document.getElementById("customPrompt").value = content;
  };

  reader.onerror = (e) => {
    console.error("Error reading file:", e);
  };

  reader.readAsText(file);
}

// Add to your initialization code
setupFileReader();
