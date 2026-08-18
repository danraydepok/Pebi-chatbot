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

    if (url.pathname === "/api/chat" && request.method === "POST") {
      try {
        const { message, history } = await request.json();
        if (!message || message.trim() === "") {
          return jsonResponse({ success: false, error: "Pesan kosong" }, 400);
        }

        let reply;
        try {
          reply = await callGroq(message, history, env.GROQ_KEY);
        } catch (groqErr) {
          console.warn("Groq gagal, coba Gemini:", groqErr.message);
          reply = await callGemini(message, env.GEMINI_KEY);
        }

        return jsonResponse({ success: true, reply });
      } catch (err) {
        console.error("Chat API error:", err);
        return jsonResponse({
          success: false,
          error: "Maaf, sedang ada gangguan. Coba lagi nanti ya."
        }, 500);
      }
    }

    return env.ASSETS.fetch(request);
  }
};

async function callGroq(message, history, apiKey) {
  const messages = [
    {
      role: "system",
      content: "Kamu adalah asisten Pebi's Kitchen, bisnis makanan. Jawab dalam Bahasa Indonesia dengan ramah dan singkat. Jika ditanya menu atau harga, arahkan untuk menghubungi admin. Maksimal 3 kalimat."
    }
  ];

  if (history && Array.isArray(history)) {
    history.slice(-6).forEach(function(h) {
      messages.push({ role: h.role === "user" ? "user" : "assistant", content: h.content });
    });
  }

  messages.push({ role: "user", content: message });

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + apiKey
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: messages,
      max_tokens: 300,
      temperature: 0.7
    })
  });

  if (!res.ok) throw new Error("Groq error: " + res.status);
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

async function callGemini(message, apiKey) {
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }],
        systemInstruction: {
          parts: [{ text: "Kamu adalah asisten Pebi's Kitchen. Jawab dalam Bahasa Indonesia, ramah dan singkat. Maksimal 3 kalimat." }]
        },
        generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
      })
    }
  );

  if (!res.ok) throw new Error("Gemini error: " + res.status);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text.trim();
}

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
                  }
