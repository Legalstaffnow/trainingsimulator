const https = require("https");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { messages, systemPrompt } = req.body;
  if (!messages || !systemPrompt) return res.status(400).json({ error: "Missing fields" });

  const body = JSON.stringify({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1000,
    system: systemPrompt,
    messages,
  });

  return new Promise((resolve) => {
    const options = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req2 = https.request(options, (response) => {
      let data = "";
      response.on("data", (chunk) => { data += chunk; });
      response.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            res.status(200).json({ text: "ERROR: " + parsed.error.message });
          } else {
            const text = parsed.content?.[0]?.text || "No response received";
            res.status(200).json({ text });
          }
        } catch (e) {
          res.status(200).json({ text: "ERROR: Could not parse response - " + data });
        }
        resolve();
      });
    });

    req2.on("error", (e) => {
      res.status(200).json({ text: "ERROR: " + e.message });
      resolve();
    });

    req2.write(body);
    req2.end();
  });
};
