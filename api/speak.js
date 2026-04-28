const https = require("https");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Missing text" });

  const voiceId = "21m00Tcm4TlvDq8ikWAM";

  const body = JSON.stringify({
    text,
    model_id: "eleven_monolingual_v1",
    voice_settings: { stability: 0.5, similarity_boost: 0.75 }
  });

  return new Promise((resolve) => {
    const options = {
      hostname: "api.elevenlabs.io",
      path: `/v1/text-to-speech/${voiceId}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req2 = https.request(options, (response) => {
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "no-cache");
      response.pipe(res);
      response.on("end", resolve);
    });

    req2.on("error", (e) => {
      res.status(500).json({ error: e.message });
      resolve();
    });

    req2.write(body);
    req2.end();
  });
};
