import { test, expect } from "@playwright/test";

// All customer & admin routes to test
const ROUTES = [
  "/",
  "/shop",
  "/p/deluxe-balloon-arch",
  "/plan-my-event",
  "/gallery",
  "/about",
  "/contact",
  "/admin/login",
];

// All required viewport widths: 360, 390, 768, 1024, 1440
const VIEWPORT_WIDTHS = [360, 390, 768, 1024, 1440];

test.describe("No Horizontal Scroll Audit (scrollWidth <= clientWidth)", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept common APIs so routes render cleanly without hanging
    await page.route(/\/api\/settings\/public/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            business: { name: "Decor Joy Gurgaon", phone: "+917015767715", whatsapp: "+917015767715" },
            slots: [],
            serviceablePincodes: [],
            paymentMode: "advance_online",
          },
        }),
      });
    });

    await page.route(/\/api\/products/, async (route) => {
      const url = route.request().url();
      if (url.includes("deluxe-balloon-arch")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              product: {
                _id: "p1",
                title: "Deluxe Balloon Arch",
                slug: "deluxe-balloon-arch",
                basePricePaise: 299900,
                images: [{ url: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800" }],
                variants: [],
                includedItems: ["Balloon ring", "Foil balloons"],
                addOnIds: [],
              },
              related: [],
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              products: [],
              pagination: { total: 0, page: 1, limit: 20, pages: 0 },
            },
          }),
        });
      }
    });

    await page.route(/\/api\/categories/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.route(/\/api\/gallery/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.route(/\/api\/testimonials/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    await page.route(/\/api\/forms/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            title: "Birthday Planning",
            fields: [
              { id: "name", type: "text", label: "Celebrant Name", required: true },
              { id: "phone", type: "phone", label: "Phone", required: true },
            ],
          },
        }),
      });
    });

    await page.route(/\/api\/orders\/track/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            orderNumber: "DJ-2026-TEST889",
            status: "confirmed",
            event: { type: "Birthday", date: "2026-10-15", address: { line1: "DLF 5", city: "Gurgaon" } },
            customer: { name: "Pooja" },
            items: [{ titleSnapshot: "Deluxe Balloon Arch", quantity: 1, unitPricePaise: 299900 }],
            pricing: { totalPaise: 299900 },
          },
        }),
      });
    });
  });

  for (const width of VIEWPORT_WIDTHS) {
    for (const route of ROUTES) {
      test(`verifies no horizontal overflow on '${route}' at ${width}px width`, async ({ page }) => {
        // Set viewport width explicitly
        await page.setViewportSize({ width, height: 800 });

        // Navigate to route
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(300);

        // Check document.documentElement.scrollWidth vs window.innerWidth
        const overflowCheck = await page.evaluate(() => {
          const docEl = document.documentElement;
          const bodyEl = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, bodyEl ? bodyEl.scrollWidth : 0);
          const clientWidth = docEl.clientWidth;
          const innerWidth = window.innerWidth;

          // Collect elements that exceed the viewport width if any
          const overflowingElements = [];
          const allEls = document.querySelectorAll("*");
          for (const el of allEls) {
            const rect = el.getBoundingClientRect();
            if (rect.right > innerWidth + 1) {
              overflowingElements.push({
                tag: el.tagName,
                className: el.className,
                id: el.id,
                right: rect.right,
                innerWidth,
              });
              if (overflowingElements.length >= 3) break;
            }
          }

          return {
            scrollWidth,
            clientWidth,
            innerWidth,
            isOverflowing: scrollWidth > innerWidth,
            overflowingElements,
          };
        });

        if (overflowCheck.isOverflowing) {
          console.error(
            `Horizontal overflow on ${route} at ${width}px: scrollWidth=${overflowCheck.scrollWidth}, innerWidth=${overflowCheck.innerWidth}`,
            overflowCheck.overflowingElements
          );
        }

        expect(
          overflowCheck.scrollWidth,
          `Route ${route} has horizontal scroll on ${width}px (scrollWidth: ${overflowCheck.scrollWidth}, innerWidth: ${overflowCheck.innerWidth})`
        ).toBeLessThanOrEqual(overflowCheck.innerWidth);
      });
    }
  }
});
