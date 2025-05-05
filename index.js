require("dotenv").config();
const express = require("express");
const puppeteer = require("puppeteer");

const app = express();

app.get("/generate-pdf", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).send("Missing invoice ID");

  const url = `${process.env.DOLIBARR_URL}/compta/facture/card.php?id=${id}`;

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    // Connexion Dolibarr
    await page.goto(`${process.env.DOLIBARR_URL}/index.php`, { waitUntil: "networkidle0" });
    await page.type("#username", process.env.DOLIBARR_USER);
    await page.type("#password", process.env.DOLIBARR_PASS);
    await page.click("input[type=submit]");
    await page.waitForNavigation();

    // Accès à la facture
    await page.goto(url, { waitUntil: "networkidle0" });

    // ✅ Attente du champ modèle
    await page.waitForSelector('select[name="model"]');
    await page.select('select[name="model"]', 'crabe');

// ✅ Clic sur le bouton GÉNÉRER (id réel confirmé via inspecteur)
 await page.waitForSelector('#builddoc_generatebutton');
 await page.click('#builddoc_generatebutton');


    // ⏳ Attente passive post-génération
    await new Promise(resolve => setTimeout(resolve, 3000));

    await browser.close();
    res.send({ success: true, id, message: "PDF correctement généré via interface Dolibarr" });
  } catch (err) {
    console.error("❌ Puppeteer error", err);
    res.status(500).send({ error: err.message });
  }
});

const server = app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});

// ⏳ Augmentation du timeout à 120s
server.setTimeout(120000);
