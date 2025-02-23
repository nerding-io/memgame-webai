import { GameLLM } from "./llm.js";
import { CATEGORIES } from "./categories.js";

class MemoryGame {
  constructor() {
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = [];
    this.isGameActive = false;
    this.selectedCategory = null;

    this.initializeElements();
    this.attachEventListeners();
    this.initLoadingUI();
    this.initLLM();
  }

  initializeElements() {
    this.gameGrid = document.getElementById("gameGrid");
    this.categoryGrid = document.getElementById("categoryGrid");
    this.hintAlert = document.getElementById("hintAlert");
    this.modal = document.getElementById("customModal");
    this.dropZone = document.getElementById("dropZone");
    this.fileInput = document.getElementById("fileInput");
    this.customPrompt = document.getElementById("customPrompt");
    this.voiceInputBtn = document.getElementById("voiceInputBtn");
    this.generateBtn = document.getElementById("generateBtn");
    this.renderCategoryGrid();
  }

  attachEventListeners() {
    document.getElementById("randomBtn").onclick = () =>
      this.selectRandomCategory();
    document.getElementById("refreshBtn").onclick = () =>
      this.initializeGame(this.selectedCategory);
    document.getElementById("hintBtn").onclick = () => this.showRandomHint();
    document.getElementById("customBtn").onclick = () => {
      this.modal.classList.remove("hidden");
      this.customPrompt.focus();
    };
    this.modal.addEventListener("click", (event) => {
      if (event.target === this.modal) {
        this.modal.classList.add("hidden");
      }
    });
    this.modal
      .querySelector(".modal-content")
      .addEventListener("click", (event) => {
        event.stopPropagation();
      });
    this.setupCustomGame();
    document
      .getElementById("voiceInputBtn")
      .addEventListener("click", startVoiceRecognition);
  }

  initLoadingUI() {
    this.loadingModal = document.createElement("div");
    this.loadingModal.className = "loading-modal hidden";
    this.loadingModal.innerHTML = `
      <div class="loading-content">
        <h3>Loading AI Model</h3>
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
        <p class="loading-status">Initializing...</p>
      </div>
    `;
    document.body.appendChild(this.loadingModal);
  }

  async initLLM() {
    try {
      this.llm = new GameLLM();
      await this.llm.init(this.updateLoadingStatus.bind(this));
    } catch (error) {
      console.error("LLM initialization failed:", error);
    }
  }

  updateLoadingStatus(status) {
    this.loadingModal.classList.remove("hidden");
    const progressFill = this.loadingModal.querySelector(".progress-fill");
    const statusText = this.loadingModal.querySelector(".loading-status");

    if (typeof status === "number") {
      console.log("Status Number:", status);
      progressFill.style.width = `${status}%`;
      statusText.textContent = `Loading model: ${Math.round(status)}%`;
    } else if (typeof status === "string" && status.includes("Loading file:")) {
      const percentage = parseInt(status.match(/\d+/)[0]);
      console.log("Status Number:", percentage);
      progressFill.style.width = `${percentage}%`;
      statusText.textContent = status;
    } else {
      console.log("Status:", status);
      statusText.textContent = status;
      if (status === 100 || status.includes("Model loaded successfully")) {
        setTimeout(() => this.loadingModal.classList.add("hidden"), 1000);
      }
    }
  }

  async initializeGame(category) {
    try {
      this.loadingModal.classList.remove("hidden");

      if (!this.llm?.isReady) {
        await this.llm?.init(this.updateLoadingStatus.bind(this));
      }

      this.updateLoadingStatus("Generating memory pairs...");

      let pairs;
      if (category === "CUSTOM") {
        pairs = await this.llm.generateCategoryPairs(this.customPrompt.value);
      } else {
        pairs =
          CATEGORIES[category]?.pairs ||
          (await this.llm.generateCategoryPairs(category));
      }

      this.cards = this.shuffleCards(pairs);
      this.gameGrid.classList.remove("hidden");
      this.categoryGrid.classList.add("hidden");
      this.renderGameGrid();
      this.isGameActive = true;
      this.flippedCards = [];
      this.matchedPairs = [];
      this.loadingModal.classList.add("hidden");
    } catch (error) {
      console.error("Failed to initialize game:", error);
      this.showHint("Failed to generate game. Please try again.");
      this.loadingModal.classList.add("hidden");
    }
  }

  selectRandomCategory() {
    const categories = Object.keys(CATEGORIES);
    const randomIndex = Math.floor(Math.random() * categories.length);
    this.selectedCategory = categories[randomIndex];
    this.updateGameTitle();
    this.initializeGame(this.selectedCategory);
  }

  shuffleCards(pairs) {
    const allCards = pairs.flatMap((pair, index) => [
      { ...pair, isFlipped: false, isFront: true, id: index },
      { ...pair, isFlipped: false, isFront: false, id: index },
    ]);
    return allCards.sort(() => Math.random() - 0.5);
  }

  renderGameGrid() {
    this.gameGrid.innerHTML = "";
    this.cards.forEach((card, index) => {
      const cardElement = this.createCardElement(card, index);
      this.gameGrid.appendChild(cardElement);
    });
  }

  createCardElement(card, index) {
    const cardDiv = document.createElement("div");
    cardDiv.className = "card";
    cardDiv.innerHTML = `
      <div class="card-inner">
        <div class="card-face card-front">
            <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18.5A2.493 2.493 0 0 1 7.51 20H7.5a2.468 2.468 0 0 1-2.4-3.154 2.98 2.98 0 0 1-.85-5.274 2.468 2.468 0 0 1 .92-3.182 2.477 2.477 0 0 1 1.876-3.344 2.5 2.5 0 0 1 3.41-1.856A2.5 2.5 0 0 1 12 5.5m0 13v-13m0 13a2.493 2.493 0 0 0 4.49 1.5h.01a2.468 2.468 0 0 0 2.403-3.154 2.98 2.98 0 0 0 .847-5.274 2.468 2.468 0 0 0-.921-3.182 2.477 2.477 0 0 0-1.875-3.344A2.5 2.5 0 0 0 14.5 3 2.5 2.5 0 0 0 12 5.5m-8 5a2.5 2.5 0 0 1 3.48-2.3m-.28 8.551a3 3 0 0 1-2.953-5.185M20 10.5a2.5 2.5 0 0 0-3.481-2.3m.28 8.551a3 3 0 0 0 2.954-5.185"/>
            </svg>
        </div>
        <div class="card-face card-back">
          ${card.isFront ? card.front : card.back}
          <div class="match-icon hidden">
            <svg class="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12.01 6.001C6.5 1 1 8 5.782 13.001L12.011 20l6.23-7C23 8 17.5 1 12.01 6.002Z"/>
            </svg>
          </div>
        </div>
      </div>
    `;
    cardDiv.onclick = () => this.handleCardClick(index);
    return cardDiv;
  }

  handleCardClick(index) {
    if (
      !this.isGameActive ||
      this.flippedCards.length >= 2 ||
      this.matchedPairs.includes(this.cards[index].id) ||
      this.flippedCards.includes(index)
    ) {
      return;
    }

    const cardElement = this.gameGrid.children[index];
    cardElement.querySelector(".card-inner").style.transform =
      "rotateY(180deg)";

    this.flippedCards.push(index);
    if (this.flippedCards.length === 2) {
      this.checkForMatch();
    }
  }

  checkForMatch() {
    const [firstIndex, secondIndex] = this.flippedCards;
    const firstCard = this.cards[firstIndex];
    const secondCard = this.cards[secondIndex];

    if (
      firstCard.id === secondCard.id &&
      firstCard.isFront !== secondCard.isFront &&
      !this.matchedPairs.includes(firstCard.id)
    ) {
      this.handleMatch(firstIndex, secondIndex);
    } else {
      this.handleMismatch(firstIndex, secondIndex);
    }
  }

  handleMatch(firstIndex, secondIndex) {
    const cards = this.gameGrid.children;
    const firstCard = this.cards[firstIndex];

    cards[firstIndex].querySelector(".match-icon").classList.remove("hidden");
    cards[secondIndex].querySelector(".match-icon").classList.remove("hidden");

    this.matchedPairs.push(firstCard.id);
    this.showHint(firstCard.explanation);

    if (this.matchedPairs.length === this.cards.length / 2) {
      setTimeout(() => this.handleGameComplete(), 500);
    }

    this.flippedCards = [];
  }

  handleMismatch(firstIndex, secondIndex) {
    setTimeout(() => {
      const cards = this.gameGrid.children;
      cards[firstIndex].querySelector(".card-inner").style.transform = "";
      cards[secondIndex].querySelector(".card-inner").style.transform = "";
      this.flippedCards = [];
    }, 1000);
  }

  handleGameComplete() {
    this.isGameActive = false;
    this.showHint("Congratulations! You've completed the game! 🎉");
  }

  showRandomHint() {
    if (!this.isGameActive || this.cards.length === 0) return;

    const unmatched = this.cards.filter(
      (card) => !this.matchedPairs.includes(card.id)
    );
    if (unmatched.length === 0) return;

    const randomCard = unmatched[Math.floor(Math.random() * unmatched.length)];
    this.showHint(`Try to find the match for: ${randomCard.front}`);
  }

  showHint(message) {
    this.hintAlert.textContent = message;
    this.hintAlert.classList.remove("hidden");
    setTimeout(() => {
      this.hintAlert.classList.add("hidden");
    }, 3000);
  }

  updateGameTitle() {
    const gameTitle = document.querySelector(".game-title");
    gameTitle.textContent =
      this.selectedCategory === "CUSTOM"
        ? "Custom Game"
        : CATEGORIES[this.selectedCategory]?.name || "Select Game";
  }

  setupCustomGame() {
    if (!this.dropZone || !this.fileInput) return;

    this.dropZone.ondragover = (e) => {
      e.preventDefault();
      this.dropZone.classList.add("dragover");
    };

    this.dropZone.ondragleave = () => {
      this.dropZone.classList.remove("dragover");
    };

    this.dropZone.ondrop = (e) => {
      e.preventDefault();
      this.dropZone.classList.remove("dragover");
      const file = e.dataTransfer.files[0];
      if (file && file.type === "text/plain") {
        this.readFile(file);
      }
    };

    this.dropZone.onclick = () => this.fileInput.click();

    this.fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        this.readFile(file);
      }
    };

    this.generateBtn.onclick = () => {
      if (this.customPrompt.value.trim()) {
        this.generateCustomGame(this.customPrompt.value);
        this.modal.classList.add("hidden");
      }
    };
  }

  async generateCustomGame(prompt) {
    this.selectedCategory = "CUSTOM";
    this.updateGameTitle();
    await this.initializeGame(prompt);
  }

  readFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.customPrompt.value = e.target.result;
    };
    reader.readAsText(file);
  }

  renderCategoryGrid() {
    this.gameGrid.classList.add("hidden");
    this.categoryGrid.classList.remove("hidden");
    this.categoryGrid.innerHTML = "";

    Object.entries(CATEGORIES).forEach(([key, category]) => {
      const categoryCard = document.createElement("div");
      categoryCard.className = "category-card";
      categoryCard.dataset.category = key.toLowerCase();
      categoryCard.innerHTML = `
        <div class="category-icon">${category.icon}</div>
        <div class="category-name">${category.name}</div>
      `;
      categoryCard.onclick = () => {
        this.selectedCategory = key;
        this.updateGameTitle();
        this.initializeGame(key);
      };
      this.categoryGrid.appendChild(categoryCard);
    });
  }
}

function startVoiceRecognition() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Speech recognition is not supported in this browser. Try Chrome.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  const textarea = document.getElementById("customPrompt");
  const voiceBtn = document.getElementById("voiceInputBtn");

  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  // Visual feedback - add a recording class
  voiceBtn.classList.add("recording");

  recognition.onstart = () => {
    console.log("Speech recognition started");
  };

  recognition.onresult = (event) => {
    console.log("Speech recognition result:", event.results);
    const transcript = event.results[0][0].transcript;
    console.log("Transcript:", transcript);
    textarea.value = textarea.value
      ? `${textarea.value}\n${transcript}`
      : transcript;
  };

  recognition.onend = () => {
    console.log("Speech recognition ended");
    voiceBtn.classList.remove("recording");
  };

  recognition.onerror = (event) => {
    // More descriptive error handling
    const errorMessages = {
      "no-speech": "No speech was detected. Please try again.",
      "audio-capture": "No microphone was found or microphone is disabled.",
      "not-allowed":
        "Microphone permission was denied. Please allow microphone access.",
      network: "Network error occurred. Please check your connection.",
      aborted: "Speech recognition was aborted. Please try again.",
    };

    const errorMessage =
      errorMessages[event.error] || `Speech recognition error: ${event.error}`;
    console.error(errorMessage, event);
    alert(errorMessage);

    voiceBtn.classList.remove("recording");
  };

  try {
    recognition.start();
    console.log("Called recognition.start()");
  } catch (err) {
    console.error("Error starting recognition:", err);
    voiceBtn.classList.remove("recording");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const game = new MemoryGame();
});
