import puppeteer from "puppeteer";

export async function crawlFromPermalink(permalink: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(permalink, { waitUntil: "networkidle2" });

    const likeCount = await page.evaluate(() => {
      const svgWithTitle = Array.from(document.querySelectorAll("svg")).find(
        (svg) => {
          const titleText = svg.querySelector("title")?.textContent || "";
          return (
            titleText.includes("좋아요") || titleText.includes("좋아요 취소")
          );
        }
      );

      if (!svgWithTitle) return 0;

      const span =
        svgWithTitle.parentElement?.querySelector("span > div > span");
      const raw = span?.textContent?.replace(/,/g, "") || "0";

      return parseInt(raw, 10);
    });

    return { likes: likeCount, shares: 0 };
  } catch (e) {
    console.error("Permalink 크롤링 실패:", e);
    return { likes: 0, shares: 0 };
  } finally {
    await browser.close();
  }
}
