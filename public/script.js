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
1. State which **paragraph** or **section** contains the answer.
2. Quote or paraphrase the **exact sentence** that proves the answer.
3. Be detailed but clear — this is for exam training.

Only summarize the passage if the student requests it explicitly.
`;

  const maxPages = 13;
  let imageMessages = [
    { type: "text", text: instruction },
    { type: "text", text: question }
  ];

  const baseUrl = `${window.location.origin}/exam/IELTS/${currentExamId}_page`;

  let availablePages = 0;

  for (let i = 1; i <= maxPages; i++) {
    const url = `${baseUrl}${i}.png`;
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) {
        imageMessages.push({
          type: "image_url",
          image_url: { url }
        });
        console.log(`✅ Found image: ${url}`);
        availablePages++;
      } else {
        console.warn(`⚠️ Skipped: ${url} (404)`);
      }
    } catch (err) {
      console.warn(`⚠️ Error fetching: ${url}`, err);
    }
  }

  if (availablePages === 0) {
    responseBox.textContent = "❌ 沒有找到任何圖片頁面，請確認檔案是否上傳正確。";
    return;
  }

  fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: question, messages: imageMessages })
  })
    .then(async res => {
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (err) {
        console.error("❌ Server returned non-JSON:", text);
        throw new Error("GPT returned non-JSON response");
      }
    })
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
  return /[\u4e00-\u9fa5]/.test(text) ? "zh-CN" : "en-GB";
}

function getVoiceForLang(lang) {
  const voices = speechSynthesis.getVoices();
  if (lang === "zh-CN") {
    return voices.find(v => v.lang === "zh-CN") || voices.find(v => v.name.includes("Google 普通话 女声"));
  } else {
    return voices.find(v => v.lang === "en-GB") || voices.find(v => v.name.includes("Google UK English Female"));
  }
}

function speakMixed(text) {
  const segments = text.split(/(?<=[。.!?])/).map(s => s.trim()).filter(Boolean);
  let index = 0;

  function speakNext() {
    if (index >= segments.length) return;
    const segment = segments[index++];
    const lang = detectLang(segment);
    const utter = new SpeechSynthesisUtterance(segment);
    utter.lang = lang;
    utter.voice = getVoiceForLang(lang);
    utter.rate = 1;
    utter.onend = speakNext;
    speechSynthesis.speak(utter);
  }

  speechSynthesis.cancel();
  speakNext();
}

document.getElementById("ttsBtn")?.addEventListener("click", () => {
  const english = responseBox.textContent.trim();
  const chinese = translationBox.textContent.replace(/^🇨🇳 中文翻譯：/, "").trim();
  speakMixed(`${english} ${chinese}`);
});

document.getElementById("stopTTSBtn")?.addEventListener("click", () => {
  speechSynthesis.cancel();
  console.log("🛑 TTS playback stopped");
});

// 🎤 Manual press-and-hold mic input (no auto-timeout)
if (window.SpeechRecognition || window.webkitSpeechRecognition) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = "zh-CN";
  recognition.continuous = false;
  recognition.interimResults = false;

  micBtn.addEventListener("mousedown", () => {
    recognition.start();
    micBtn.textContent = "🎤 錄音中... (請持續按住)";
  });

  micBtn.addEventListener("mouseup", () => {
    recognition.stop();
    micBtn.textContent = "🎤 語音提問";
  });

  micBtn.addEventListener("mouseleave", () => {
    recognition.stop();
    micBtn.textContent = "🎤 語音提問";
  });

  micBtn.addEventListener("touchstart", () => {
    recognition.start();
    micBtn.textContent = "🎤 錄音中... (請持續按住)";
  });

  micBtn.addEventListener("touchend", () => {
    recognition.stop();
    micBtn.textContent = "🎤 語音提問";
  });

  recognition.onresult = (event) => {
    const spoken = event.results[0][0].transcript;
    questionInput.value = spoken;
    submitQuestion();
  };

  recognition.onerror = (event) => {
    alert("🎤 錄音失敗，請重試。");
    console.error("Mic error:", event.error);
  };
}

window.submitQuestion = submitQuestion;
window.setExam = setExam;
window.clearHistory = clearHistory;
