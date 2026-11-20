import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

const STYLE = "Polished colorful hand-painted 2D cartoon background for Indian village moral-story animation, clean confident outlines, smooth shapes, layered foliage, vivid greens, cyan-blue sky, soft clouds, warm sunlight, professional TV cartoon environment plate, not a photograph.";
const NEGATIVE = "No people, humans, characters, faces, animals, birds, text, logo, watermark, photorealism, 3D, CGI, anime, sketch, blur, low resolution, distorted buildings.";

app.get("/api/status", (_, res) => res.json({ provider: "Pollinations legacy image endpoint", configured: true, note: "Free anonymous endpoint; strict rate limits may apply." }));

app.post("/api/generate", async (req, res) => {
  try {
    const { scene, time, aspect, details } = req.body || {};
    const ratio = ["16:9", "9:16", "4:3"].includes(aspect) ? aspect : "16:9";
    const dimensions = ratio === "9:16" ? [432, 768] : ratio === "4:3" ? [640, 480] : [768, 432];
    const lighting = time === "Night"
      ? "peaceful moonlit night, deep blue sky, warm glowing windows and lantern light"
      : "bright sunny daytime, vivid blue sky, soft clouds and warm sunlight";
    const prompt = `${STYLE}
SCENE: ${String(scene || "Traditional Indian village courtyard").slice(0, 500)}.
LIGHTING: ${lighting}.
COMPOSITION: ${ratio} aspect ratio, cinematic establishing background.
DETAILS: ${String(details || "").slice(0, 500)}.
EXCLUSIONS: ${NEGATIVE}
Generate exactly one image, not a text description.`;

    const url = new URL("https://image.pollinations.ai/prompt/" + encodeURIComponent(prompt));
    url.searchParams.set("width", String(dimensions[0]));
    url.searchParams.set("height", String(dimensions[1]));
    url.searchParams.set("seed", String(Math.floor(Math.random() * 2147483647)));

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 VillageBackgroundStudio/1.0", "Accept": "image/*" },
      signal: AbortSignal.timeout(120000)
    });

    if (!response.ok) {
      const message = response.status === 402
        ? "Pollinations free anonymous limit reached or payment required. Please wait and try later; this service may require payment."
        : response.status === 429
          ? "Pollinations is busy or rate-limited. Please wait before trying again."
          : `Pollinations image service returned HTTP ${response.status}. Please try again later.`;
      return res.status(response.status === 402 ? 429 : 502).json({ error: message });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return res.status(502).json({ error: "Image service did not return an image. Please try again later." });
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length) return res.status(502).json({ error: "Image service returned an empty image." });
    res.json({ imageData: `data:${contentType};base64,${bytes.toString("base64")}`, prompt });
  } catch (error) {
    res.status(500).json({ error: "Generation failed: " + error.message });
  }
});

app.get("*", (_, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(process.env.PORT || 3000, () => console.log("Village Background Studio started with Pollinations"));
