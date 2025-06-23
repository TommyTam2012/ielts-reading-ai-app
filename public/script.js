console.log("🟢 script.js loaded successfully");

const responseBox = document.getElementById("responseBox");
const questionInput = document.getElementById("questionInput");
const historyList = document.getElementById("historyList");
const micBtn = document.getElementById("micBtn");

const translationBox = document.createElement("div");
translationBox.id = "chineseTranslation";
translationBox.style.marginTop = "10px";
translationBox.style.fontSize = "0.95em";
translationBox.style.color = "#333";
responseBox.insertAdjacentElement("afterend", translationBox);

let currentExamId = "";

// ✅ Updated to bypass popup blockers
function setExam(examId) {
  currentExamId = examId;
  const pdfUrl = `/exam/IELTS/${examId}.pdf`;

  const newTab = window.open("about:blank", "_blank");
  if (newTab) {
    newTab.location.href = pdfUrl;
    console.log(`📘 Opening: ${pdfUrl}`);
  } else {
    alert("⚠️ 請允許瀏覽器開啟新分頁。");
  }
}

function clearHistory() {
  historyList.innerHTML = "";
  console.log("🧹 History cleared");
}

async function submitQuestion() {
  const question = questionInput.value.trim();
  if (!question || !currentExamId) {
    alert("⚠️ 請選擇試卷並輸入問題");
    return;
  }

  responseBox.textContent = "正在分析中，請稍候...";
  translationBox.textContent = "";

  const instruction = `
You are an IELTS Academic Reading instructor. The student is asking about test ${currentExamId.toUpperCase()}.
If they ask about a specific question (e.g., Q5 or paragraph C), find the correct answer from the images provided.
After providing the answer:
1. State which paragraph or section contains the answer.
2. Quote or paraphrase the exact sentence that proves it.
3. Be detailed but clear — this is for exam training.
Only summarize the passage if the student requests it explicitly.
`;

  const maxPages = 13;
  const baseUrl = `${window.location.origin}/exam/IELTS/${currentExamId}_page`;
  const imageMessages = [
    { type: "text", text: instruction },
    { type: "text", text: question }
  ];

  for (let i = 1; i <= maxPages; i++) {
    const url = `${baseUrl}${i}.png`;
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) {
        imageMessages.push({ type: "image_url", image_url: { url } });
        console.log(`✅ Found: ${url}`);
      }
    } catch (err) {
      console.warn(`⚠️ Error checking: ${url}`, err);
    }
  }

  fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: question, messages: imageMessages })
  })
    .then(res => res.json())
    .then(data => {
      const answer = data.response || "❌ 無法獲取英文回答。";
      const translated = data.translated || "❌ 無法翻譯為中文。";
      const didStream = data.didStreamUrl;

      responseBox.textContent = answer;
      translationBox.textContent = `🇨🇳 中文翻譯：${translated}`;

      speakWithMyVoice(answer);
      if (didStream) switchToDIDStream(didStream);

      addToHistory(question, `${answer}<br><em>🇨🇳 中文翻譯：</em>${translated}`);
    })
    .catch(err => {
      responseBox.textContent = "❌ 發生錯誤，請稍後重試。";
      console.error("GPT error:", err);
    });

  questionInput.value = "";
}

function addToHistory(question, answer) {
  const li = document.createElement("li");
  li.innerHTML = `<strong>問：</strong>${question}<br/><strong>答：</strong>${answer}`;
  historyList.prepend(li);
}

// ✅ ElevenLabs Voice Integration
async function speakWithMyVoice(text) {
  try {
    const res = await fetch("/api/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const data = await res.json();
    if (data.didStreamUrl) {
      switchToDIDStream(data.didStreamUrl);
    }

    if (data.audioBase64) {
      const audio = new Audio(`data:audio/mpeg;base64,${data.audioBase64}`);
      audio.play();
    }
  } catch (err) {
    console.error("🎤 Voice error:", err);
  }
}

// 🎥 D-ID Avatar Switching
function switchToDIDStream(streamUrl) {
  const iframe = document.getElementById("didVideo");
  const staticAvatar = document.getElementById("avatarImage");
  iframe.src = streamUrl;
  iframe.style.display = "block";
  staticAvatar.style.display = "none";
  console.log("🎥 D-ID stream activated:", streamUrl);
}

// 🎤 Voice Input (Mic → Text → GPT)
if (window.SpeechRecognition || window.webkitSpeechRecognition) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = "zh-CN";
  recognition.continuous = false;
  recognition.interimResults = false;

  let finalTranscript = "";
  let isHoldingMic = false;
  let restartCount = 0;
  const maxRestarts = 3;

  recognition.onstart = () => {
    micBtn.textContent = "🎤 正在錄音... (松开发送)";
    console.log("🎙️ Mic started");
  };

  recognition.onresult = (event) => {
    finalTranscript = event.results[0][0].transcript;
    console.log("📥 Captured:", finalTranscript);
  };

  recognition.onend = () => {
    if (isHoldingMic && restartCount < maxRestarts) {
      console.log("🔁 Restarting mic");
      restartCount++;
      recognition.start();
    } else {
      micBtn.textContent = "🎤 語音提問";
      if (finalTranscript.trim()) {
        questionInput.value = finalTranscript;
        submitQuestion();
      } else {
        console.log("⚠️ 沒有檢測到語音內容");
      }
    }
  };

  recognition.onerror = (event) => {
    console.error("🎤 Speech error:", event.error);
    micBtn.textContent = "🎤 語音提問";
  };

  micBtn.addEventListener("mousedown", () => {
    isHoldingMic = true;
    restartCount = 0;
    finalTranscript = "";
    recognition.start();
  });

  micBtn.addEventListener("mouseup", () => {
    isHoldingMic = false;
    recognition.stop();
  });

  micBtn.addEventListener("touchstart", () => {
    isHoldingMic = true;
    restartCount = 0;
    finalTranscript = "";
    recognition.start();
  });

  micBtn.addEventListener("touchend", () => {
    isHoldingMic = false;
    recognition.stop();
  });
}

// ✅ GLOBAL BINDINGS (after DOM ready)
document.addEventListener("DOMContentLoaded", () => {
  window.submitQuestion = submitQuestion;
  window.setExam = setExam;
  window.clearHistory = clearHistory;
});
