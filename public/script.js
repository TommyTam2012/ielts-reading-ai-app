console.log("🟢 script.js loaded successfully");

// ✅ Logging directly to Upstash
async function logToUpstash(name, email, action = "login") {
  const hkTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Hong_Kong"
  });

  const logKey = `log:${Date.now()}`;
  const logValue = JSON.stringify({ name, email, action, time: hkTime });

  const url = "https://firm-imp-16671.upstash.io/set/" + logKey;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Bearer AUEfAAIjcDFkMTBkNTFmYmIzM2I0ZGQwYTUzODk5NDI2YmZkNTMwZHAxMA",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(logValue)
    });

    if (res.ok) {
      console.log("✅ Log stored in Upstash");
    } else {
      const text = await res.text();
      throw new Error(`❌ Failed to log: ${text}`);
    }
  } catch (err) {
    console.error("❌ Network error:", err);
  }
}

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

function setExam(examId) {
  currentExamId = examId;
  const pdfUrl = `/exam/IELTS/${examId}.pdf`;
  window.open(pdfUrl, "_blank");
  console.log(`📘 Exam set to ${examId}`);
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
      responseBox.textContent = answer;
      translationBox.textContent = `🇨🇳 中文翻譯：${translated}`;
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

function detectLang(text) {
  return /[一-龥]/.test(text) ? "zh-CN" : "en-GB";
}

let cachedVoices = [];
window.speechSynthesis.onvoiceschanged = () => {
  cachedVoices = speechSynthesis.getVoices();
};

function getVoiceForLang(lang) {
  if (!cachedVoices.length) cachedVoices = speechSynthesis.getVoices();
  return cachedVoices.find(v => v.lang === lang)
    || cachedVoices.find(v => v.name.includes(lang.includes("zh") ? "普通话" : "English"))
    || cachedVoices[0];
}

function chunkText(text, maxLength = 180) {
  const chunks = [];
  let current = '';
  const parts = text.match(/[^。！？.!?\n]+[。！？.!?\n]?/g) || [text];

  for (const part of parts) {
    if ((current + part).length > maxLength) {
      if (current) chunks.push(current.trim());
      current = part;
    } else {
      current += part;
    }
  }

  if (current) chunks.push(current.trim());
  return chunks;
}

function speakMixed(text) {
  const segments = chunkText(text);
  let index = 0;

  function speakNext() {
    if (index >= segments.length) return;

    const segment = segments[index++];
    const lang = detectLang(segment);
    const utter = new SpeechSynthesisUtterance(segment);
    utter.lang = lang;
    utter.voice = getVoiceForLang(lang);
    utter.rate = 1;

    utter.onend = () => {
      setTimeout(speakNext, 250); // Delay avoids cut-off
    };

    speechSynthesis.speak(utter);
  }

  speechSynthesis.cancel(); // Reset any previous speech
  setTimeout(() => speakNext(), 100); // Small start delay
}

document.getElementById("ttsBtn")?.addEventListener("click", () => {
  const english = responseBox.textContent.trim();
  const chinese = translationBox.textContent.replace(/^🇨🇳 中文翻譯：/, "").trim();
  speakMixed(`${english} ${chinese}`);
});

document.getElementById("stopTTSBtn")?.addEventListener("click", () => {
  speechSynthesis.cancel();
});

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
    micBtn.textContent = "🎤 正在录音... (松开发送)";
    console.log("🎙️ Mic started");
  };

  recognition.onresult = (event) => {
    finalTranscript = event.results[0][0].transcript;
    console.log("📥 Captured:", finalTranscript);
  };

  recognition.onend = () => {
    if (isHoldingMic && restartCount < maxRestarts) {
      console.log("🔁 Restarting mic (hold still active)");
      restartCount++;
      recognition.start();
    } else {
      micBtn.textContent = "🎤 语音提问";
      console.log("🛑 Mic released or max restarts reached");
      if (finalTranscript.trim()) {
        questionInput.value = finalTranscript;
        submitQuestion();
      } else {
        console.log("⚠️ 没有检测到语音内容。");
      }
    }
  };

  recognition.onerror = (event) => {
    console.error("🎤 Speech error:", event.error);
    micBtn.textContent = "🎤 语音提问";
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

window.submitQuestion = submitQuestion;
window.setExam = setExam;
window.clearHistory = clearHistory;
