import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

test.describe("Full Customer Booking Flow with Screenshots", () => {
  test.beforeEach(async ({ page }) => {
    // Mock Public Settings
    await page.route(/\/api\/settings\/public/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            business: {
              name: "Decor Joy Gurgaon",
              phone: "+917015767715",
              whatsapp: "+917015767715",
              email: "decorjoygurgaon@gmail.com",
            },
            slots: [
              {
                key: "evening",
                label: "Evening (05:00 PM - 09:00 PM)",
                startTime: "17:00",
                endTime: "21:00",
                capacityPerDay: 5,
              },
              {
                key: "morning",
                label: "Morning (09:00 AM - 01:00 PM)",
                startTime: "09:00",
                endTime: "13:00",
                capacityPerDay: 5,
              },
            ],
            serviceablePincodes: [
              { pincode: "122001", deliveryFeePaise: 0 },
              { pincode: "122002", deliveryFeePaise: 0 },
            ],
            paymentMode: "advance_online",
            advancePercent: 25,
          },
        }),
      });
    });

    // Mock Products Catalog & Detail
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
                _id: "prod_101",
                title: "Grand Ring Balloon Arch",
                slug: "deluxe-balloon-arch",
                shortDescription: "Signature 7ft circular balloon arch setup",
                basePricePaise: 349900,
                compareAtPricePaise: 449900,
                images: [
                  {
                    url: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800",
                    alt: "Ring Arch",
                  },
                ],
                variants: [
                  {
                    name: "Theme Color",
                    options: [
                      { label: "Rose Gold & White", priceDeltaPaise: 0, colorCode: "#d4af37" },
                      { label: "Midnight Blue & Silver", priceDeltaPaise: 50000, colorCode: "#1e3a8a" },
                    ],
                  },
                ],
                includedItems: ["7ft Metal Ring Backdrop", "200+ Chrome & Pastel Balloons", "Custom Signage"],
                addOnIds: [
                  {
                    _id: "addon_1",
                    name: "Happy Birthday Neon Sign",
                    pricePaise: 50000,
                  },
                ],
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
              products: [
                {
                  _id: "prod_101",
                  title: "Grand Ring Balloon Arch",
                  slug: "deluxe-balloon-arch",
                  shortDescription: "Signature 7ft circular balloon arch setup",
                  basePricePaise: 349900,
                  compareAtPricePaise: 449900,
                  images: [
                    {
                      url: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800",
                      alt: "Ring Arch",
                    },
                  ],
                },
              ],
              pagination: { total: 1, page: 1, limit: 20, pages: 1 },
            },
          }),
        });
      }
    });

    // Mock Categories
    await page.route(/\/api\/categories/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            { _id: "cat_1", name: "Birthdays", slug: "birthdays" },
            { _id: "cat_2", name: "Anniversaries", slug: "anniversaries" },
          ],
        }),
      });
    });

    // Mock Availability
    await page.route(/\/api\/availability/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            date: "2026-10-15",
            blackout: false,
            slots: [
              {
                key: "evening",
                label: "Evening (05:00 PM - 09:00 PM)",
                startTime: "17:00",
                endTime: "21:00",
                remainingCapacity: 4,
                isAvailable: true,
              },
            ],
          },
        }),
      });
    });

    // Mock Quotes
    await page.route(/\/api\/quotes/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            items: [
              {
                productId: "prod_101",
                titleSnapshot: "Grand Ring Balloon Arch",
                quantity: 1,
                unitPricePaise: 349900,
                subtotalPaise: 349900,
              },
            ],
            pricing: {
              itemsSubtotalPaise: 349900,
              discountPaise: 0,
              deliveryFeePaise: 0,
              totalPaise: 349900,
              advanceDuePaise: 87475,
              balanceDuePaise: 262425,
            },
          },
        }),
      });
    });

    // Mock Order Creation & Razorpay
    await page.route(/\/api\/orders(?!\/track)/, async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            orderNumber: "DJ-2026-TEST889",
            status: "pending_advance",
            amount: 87475,
            razorpayOrderId: "order_mock_test_12345",
            keyId: "rzp_test_mockKey",
          },
        }),
      });
    });

    // Mock Order Tracking query
    await page.route(/\/api\/orders\/track/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            orderNumber: "DJ-2026-TEST889",
            status: "confirmed",
            event: {
              type: "Birthday",
              date: "2026-10-15",
              slotKey: "evening",
              address: {
                line1: "Flat 402, DLF Phase 5",
                city: "Gurugram",
                pincode: "122001",
              },
            },
            customer: {
              name: "Pooja Malhotra",
              phone: "+919876543210",
            },
            items: [
              {
                titleSnapshot: "Grand Ring Balloon Arch",
                quantity: 1,
                unitPricePaise: 349900,
              },
            ],
            pricing: {
              totalPaise: 349900,
              advancePaidPaise: 87475,
              balanceDuePaise: 262425,
            },
          },
        }),
      });
    });
  });

  test("completes browse -> product -> pick date/slot -> checkout -> tracking with screenshots", async ({
    page,
  }, testInfo) => {
    page.on("console", (msg) => console.log("BROWSER CONSOLE:", msg.type(), msg.text()));
    page.on("pageerror", (err) => console.log("PAGE UNCAUGHT ERROR:", err.message, err.stack));
    page.on("requestfailed", (req) =>
      console.log("REQUEST FAILED:", req.url(), req.failure()?.errorText)
    );
    page.on("response", (res) => {
      if (res.url().includes("api")) {
        console.log("API RES:", res.status(), res.url());
      }
    });

    const projectName = testInfo.project.name;
    const screenshotDir = path.join(process.cwd(), "e2e", "screenshots");
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // Step 1: Browse Shop Catalog
    await page.goto("/shop");
    await expect(page).toHaveTitle(/Decor Joy Gurgaon/i);
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(screenshotDir, `${projectName}-1-browse.png`),
      fullPage: false,
    });

    // Step 2: Open Product Detail
    await page.goto("/p/deluxe-balloon-arch", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(/Grand Ring Balloon Arch/i, { timeout: 15000 });

    // Pick date and slot
    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible()) {
      await dateInput.fill("2026-10-15");
    }

    const slotSelect = page.locator("select.schedule-input");
    if (await slotSelect.isVisible()) {
      await slotSelect.selectOption({ index: 1 });
    }

    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotDir, `${projectName}-2-product.png`),
      fullPage: false,
    });

    // Step 3: Populate cart and proceed to Checkout
    await page.evaluate(() => {
      localStorage.setItem(
        "decorjoy_cart_v3",
        JSON.stringify([
          {
            id: "item_test_101",
            productId: "prod_101",
            variantSelections: [],
            addOnIds: [],
            quantity: 1,
            date: "2026-10-15",
            slotKey: "evening",
            title: "Grand Ring Balloon Arch",
          },
        ])
      );
    });

    // Navigate to checkout with items
    await page.goto("/checkout");
    await page.waitForSelector('input[placeholder*="Radhika"]', { timeout: 10000 });

    // Populate checkout form
    await page.fill('input[placeholder*="Radhika"]', "Pooja Malhotra");
    await page.fill('input[placeholder*="9876543210"]', "9876543210");
    await page.fill('input[placeholder*="Crest"]', "Flat 402, DLF Phase 5");

    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotDir, `${projectName}-3-checkout.png`),
      fullPage: false,
    });

    // Step 4: Tracking Page
    await page.goto("/order/DJ-2026-TEST889");
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(screenshotDir, `${projectName}-4-tracking.png`),
      fullPage: false,
    });

    // Verify order tracking page loaded
    await expect(page.locator("body")).toContainText(/DJ-2026-TEST889/i);
  });
});
