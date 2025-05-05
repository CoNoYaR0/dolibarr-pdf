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

    // ✅ Sélection du modèle PDF si nécessaire
    await page.waitForSelector('select[name="modelpdf"]');
    await page.select('select[name="modelpdf"]', 'crabe');

    // ✅ Clique sur le bouton "GÉNÉRER"
    await page.waitForSelector('input[type="submit"][value="GÉNÉRER"]');
    await page.click('input[type="submit"][value="GÉNÉRER"]');

    // ⏳ Attend que Dolibarr attache le fichier PDF
    await new Promise(resolve => setTimeout(resolve, 3000));

    await browser.close();
    res.send({ success: true, id, message: "PDF correctement généré via interface Dolibarr" });
  } catch (err) {
    console.error("❌ Puppeteer error", err);
    res.status(500).send({ error: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
