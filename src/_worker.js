export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    if (url.pathname === "/api/health") {
      const result = {
        groqKey: Boolean(env.GROQ_KEY),
        geminiKey: Boolean(env.GEMINI_KEY),
        groq: null,
        gemini: null
      };
      if (env.GROQ_KEY) {
        try { await callGroq("Halo", [], env.GROQ_KEY); result.groq = "OK"; }
        catch (e) { result.groq = "GAGAL: " + e.message; }
      }
      if (env.GEMINI_KEY) {
        try { await callGemini("Halo", env.GEMINI_KEY); result.gemini = "OK"; }
        catch (e) { result.gemini = "GAGAL: " + e.message; }
      }
      return jsonResponse(result);
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json();
        const message = body.message || "";
        const history = body.history || [];
        if (!message.trim()) {
          return jsonResponse({ success: false, error: "Pesan kosong" }, 400);
        }

        const errors = [];
        let reply = null;

        if (env.GROQ_KEY) {
          try { reply = await callGroq(message, history, env.GROQ_KEY); }
          catch (e) { errors.push("Groq: " + e.message); }
        } else { errors.push("Groq: key tidak ada"); }

        if (!reply && env.GEMINI_KEY) {
          try { reply = await callGemini(message, env.GEMINI_KEY); }
          catch (e) { errors.push("Gemini: " + e.message); }
        } else if (!reply) { errors.push("Gemini: key tidak ada"); }

        if (!reply) return jsonResponse({ success: false, error: errors.join(" | ") }, 500);
        return jsonResponse({ success: true, reply: reply });
      } catch (err) {
        return jsonResponse({ success: false, error: "Error: " + err.message }, 500);
      }
    }

    return env.ASSETS.fetch(request);
  }
};

var SYSTEM_PROMPT = "Kamu adalah asisten virtual Pebi's Kitchen, bisnis kuliner di Sawangan, Depok yang menjual Dimsum Mentai dan Ceker Mercon. Jawab dalam Bahasa Indonesia dengan ramah, maksimal 3 kalimat. Info: Dimsum Mentai Rp 18.000-Rp 70.000, Ceker Mercon Rp 15.000/porsi, Combo Laris Rp 59.000, ongkir gratis sampai 5 KM, DP 50%, jam operasional Senin-Jumat 11.00-15.00 WIB. Ajak pelanggan memesan lewat tombol Racik Pesanan atau WhatsApp.";

var GROQ_MODELS = ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "openai/gpt-oss-20b"];
var GEMINI_MODELS = ["gemini-2.5-flash", "gemini-3.5-flash"];

async function callGroq(message, history, apiKey) {
  const messages = [{ role: "system", content: SYSTEM_PROMPT }];

  if (history && history.length) {
    history.slice(-6).forEach(function (h) {
      const content = h.text || h.content || "";
      if (content) {
        messages.push({ role: h.role === "assistant" ? "assistant" : "user", content: String(content) });
      }
    });
  }
  messages.push({ role: "user", content: message });

  let lastError = new Error("Groq tidak tersedia");
  for (const model of GROQ_MODELS) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + apiKey
        },
        body: JSON.stringify({ model: model, messages: messages, max_tokens: 300, temperature: 0.7 })
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (content) return content.trim();
        lastError = new Error("Respon Groq kosong");
      } else {
        lastError = new Error("HTTP " + res.status + " (model " + model + ")");
      }
    } catch (e) { lastError = e; }
  }
  throw lastError;
}

async function callGemini(message, apiKey) {
  let lastError = new Error("Gemini tidak tersedia");
  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }],
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
          })
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates && data.candidates[0] && data.candidates[0].content &&
          data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
        if (text) return text.trim();
        lastError = new Error("Respon Gemini kosong");
      } else {
        lastError = new Error("HTTP " + res.status + " (model " + model + ")");
      }
    } catch (e) { lastError = e; }
  }
  throw lastError;
}

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
