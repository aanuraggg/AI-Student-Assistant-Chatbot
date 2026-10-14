
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const chatBox = document.getElementById("chat-box");
const historyBox = document.getElementById("chat-history");
const newChatBtn = document.getElementById("new-chat");
const menuBtn = document.getElementById("menu-btn");
const sidebar = document.getElementById("sidebar");

const STORAGE_KEY = "student_ai_chats_v2";

let chats = [];
let currentChatId = null;
let isLoading = false;

// Load saved conversations
try {
  const saved = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "[]"
  );
  if (Array.isArray(saved)) chats = saved;
} catch (error) {
  console.error("History load error:", error);
}

function saveChats() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(chats)
    );
  } catch (error) {
    console.error("History save error:", error);
  }
}

function getCurrentChat() {
  return chats.find(chat => chat.id === currentChatId);
}

function createChat() {
  if (isLoading) return;

  const chat = {
    id: Date.now().toString() +
        Math.random().toString(36).slice(2),
    title: "New Conversation",
    messages: []
  };

  chats.unshift(chat);
  currentChatId = chat.id;

  saveChats();
  renderHistory();
  renderMessages();
  sidebar.classList.remove("open");
  input.focus();
}

function renderHistory() {
  historyBox.innerHTML = "";

  chats.forEach(chat => {
    const item = document.createElement("div");
    item.className = "history-item";

    if (chat.id === currentChatId) {
      item.classList.add("active");
    }

    const openBtn = document.createElement("button");
    openBtn.className = "history-open";
    openBtn.textContent = "💬 " + chat.title;

    openBtn.onclick = () => {
      if (isLoading) return;
      currentChatId = chat.id;
      renderHistory();
      renderMessages();
      sidebar.classList.remove("open");
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-chat";
    deleteBtn.textContent = "✕";
    deleteBtn.title = "Delete conversation";

    deleteBtn.onclick = () => {
      if (isLoading) return;

      if (!confirm("Delete this conversation?")) {
        return;
      }

      chats = chats.filter(c => c.id !== chat.id);

      if (currentChatId === chat.id) {
        currentChatId = chats.length
          ? chats[0].id
          : null;
      }

      saveChats();
      renderHistory();
      renderMessages();
    };

    item.appendChild(openBtn);
    item.appendChild(deleteBtn);
    historyBox.appendChild(item);
  });
}

function addMessage(text, sender, extraClass = "") {
  const div = document.createElement("div");
  div.className = "message " + sender;

  if (extraClass) {
    div.classList.add(extraClass);
  }

  // Safe text display
  div.textContent = text;
  chatBox.appendChild(div);

  chatBox.scrollTop = chatBox.scrollHeight;
  return div;
}

function renderMessages() {
  chatBox.innerHTML = "";

  const chat = getCurrentChat();

  if (!chat || chat.messages.length === 0) {
    const welcome = document.createElement("div");
    welcome.className = "welcome";

    const icon = document.createElement("div");
    icon.className = "welcome-icon";
    icon.textContent = "🤖";

    const title = document.createElement("h2");
    title.textContent = "How can I help you today?";

    const desc = document.createElement("p");
    desc.textContent =
      "Ask questions about coding, science, " +
      "college subjects, exams and more.";

    welcome.append(icon, title, desc);
    chatBox.appendChild(welcome);
    return;
  }

  chat.messages.forEach(msg => {
    addMessage(msg.text, msg.role);
  });
}

async function sendMessage() {
  const text = input.value.trim();

  if (!text || isLoading) return;

  if (!getCurrentChat()) {
    createChat();
  }

  const chat = getCurrentChat();

  chat.messages.push({
    role: "user",
    text: text
  });

  if (chat.messages.length === 1) {
    chat.title = text.slice(0, 30);
  }

  input.value = "";
  input.style.height = "auto";

  saveChats();
  renderHistory();
  renderMessages();

  isLoading = true;
  sendBtn.disabled = true;

  const loading = addMessage(
    "AI is thinking...",
    "bot",
    "typing"
  );

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "AI request failed"
      );
    }

    const reply = data.reply || "No response received.";

    chat.messages.push({
      role: "bot",
      text: reply
    });

    saveChats();

    loading.remove();
    addMessage(reply, "bot");

  } catch (error) {
    console.error("Chat error:", error);

    loading.remove();
    addMessage(
      "Sorry! AI connection failed. Please try again.",
      "bot"
    );

  } finally {
    isLoading = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height =
    Math.min(input.scrollHeight, 150) + "px";
});

newChatBtn.addEventListener("click", createChat);

menuBtn.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

// Open previous chat on startup
if (chats.length > 0) {
  currentChatId = chats[0].id;
}

renderHistory();
renderMessages();
