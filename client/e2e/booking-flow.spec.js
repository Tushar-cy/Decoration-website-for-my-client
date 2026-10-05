import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

test.describe("Customer Showcase & WhatsApp / Event Form Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Mock Public Settings
    await page.route(/\/api\/settings\/public/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "success",
          data: {
            business: {
              name: "Decor Joy Gurgaon",
              phone: "+91 7015767715",
              whatsapp: "+91 7015767715",
              email: "decorjoygurgaon@gmail.com",
            },
            serviceablePincodes: [
              { pincode: "122001", deliveryFeePaise: 0 },
              { pincode: "122002", deliveryFeePaise: 0 },
            ],
            socials: {
              instagram: "https://instagram.com/decorjoygurgaon",
            },
          },
        }),
      });
    });

    // Mock Public Settings Flags
    await page.route(/\/api\/settings\/flags/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "success",
          data: {
            bookingsPaused: false,
            maintenanceBanner: "",
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
            status: "success",
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
            status: "success",
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
              pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
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
          status: "success",
          data: {
            categories: [
              { _id: "cat_1", name: "Birthdays", slug: "birthdays" },
              { _id: "cat_2", name: "Anniversaries", slug: "anniversaries" },
            ],
          },
        }),
      });
    });

    // Mock Forms list
    await page.route(/\/api\/forms$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "success",
          data: {
            purposes: [
              {
                key: "birthday",
                title: "Birthday Celebration",
                description: "Custom balloon themes & party backdrops",
                fieldCount: 4,
              },
            ],
          },
        }),
      });
    });

    // Mock specific form schema
    await page.route(/\/api\/forms\/birthday$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "success",
          data: {
            form: {
              key: "birthday",
              title: "Birthday Celebration",
              description: "Tell us about the birthday milestone",
              version: 1,
              fields: [
                {
                  id: "celebrant_name",
                  label: "Birthday Person's Name",
                  type: "text",
                  required: true,
                  placeholder: "e.g. Aarav",
                },
                {
                  id: "preferred_theme",
                  label: "Preferred Theme / Color",
                  type: "text",
                  required: false,
                  placeholder: "e.g. Jungle Safari, Pastel Pink",
                },
              ],
              successMessage: "Thank you! Our decor coordinator will message you on WhatsApp shortly.",
            },
          },
        }),
      });
    });

    // Mock form submission
    await page.route(/\/api\/forms\/birthday\/submissions/, async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          status: "success",
          data: {
            submissionId: "sub_mock_12345",
            message: "Thank you! Our decor coordinator will message you on WhatsApp shortly.",
            whatsappUrl: "https://wa.me/917015767715?text=Hello",
          },
        }),
      });
    });
  });

  test("completes browse -> package detail -> WhatsApp CTA check -> Plan My Event flow", async ({
    page,
  }, testInfo) => {
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

    // Step 2: Open Package Detail
    await page.goto("/p/deluxe-balloon-arch", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(/Grand Ring Balloon Arch/i, { timeout: 15000 });

    // Verify WhatsApp CTA is visible and has WhatsApp link
    const waButton = page.locator('a[href*="wa.me"]:visible').first();
    await expect(waButton).toBeVisible();
    const waHref = await waButton.getAttribute("href");
    expect(waHref).toContain("wa.me");

    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotDir, `${projectName}-2-package-detail.png`),
      fullPage: false,
    });

    // Step 3: Plan My Event Form
    await page.goto("/plan-my-event");
    await expect(page.locator("body")).toContainText(/Plan My Event|Birthday/i);

    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotDir, `${projectName}-3-plan-event.png`),
      fullPage: false,
    });
  });
});
