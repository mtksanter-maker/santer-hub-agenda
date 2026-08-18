import express from "express";
import path from "path";

/**
 * Servidor de produção do Santer Hub.
 *
 * O site é estático: apenas entrega o build de `dist/`. Não há API própria —
 * os eventos vêm do Cloud Firestore, consultado direto pelo navegador
 * (veja src/lib/eventsService.ts).
 *
 * Em desenvolvimento use `npm run dev`, que sobe o Vite.
 */
const app = express();
const PORT = Number(process.env.PORT) || 5173;
const distPath = path.join(process.cwd(), "dist");

app.get("/api/health", (_req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

app.use(express.static(distPath));

app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
