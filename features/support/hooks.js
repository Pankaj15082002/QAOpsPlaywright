const { After, Before, setDefaultTimeout, setWorldConstructor } = require('@cucumber/cucumber');
const { chromium } = require('@playwright/test');
const { mkdir, rename } = require('node:fs/promises');
const path = require('node:path');
const { EcommercePage } = require('../pages/ecommerce.page');

function scenarioFileName(uri, name) {
  const featureName = path.basename(uri || 'feature').replace(/\.[^.]+$/, '');
  const slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${slug(featureName)}-${slug(name)}`;
}

class PlaywrightWorld {
  constructor({ attach, log, parameters }) {
    this.attach = attach;
    this.log = log;
    this.parameters = parameters;
  }
}

setWorldConstructor(PlaywrightWorld);
setDefaultTimeout(30_000);

Before(async function ({ pickle }) {
  const runId = process.env.BDD_RUN_ID || 'manual';
  this.evidenceDirectory = path.join(process.cwd(), 'reports', 'evidence', runId);
  this.scenarioFileName = scenarioFileName(pickle.uri, pickle.name);
  await mkdir(this.evidenceDirectory, { recursive: true });
  this.browser = await chromium.launch({
    headless: process.env.HEADLESS === 'true',
    slowMo: 500,
  });
  this.context = await this.browser.newContext({ recordVideo: { dir: this.evidenceDirectory } });
  this.page = await this.context.newPage();
  this.ecommercePage = new EcommercePage(this.page);
});

After(async function ({ pickle }) {
  const video = this.page?.video();
  const fileName = this.scenarioFileName || scenarioFileName(pickle.uri, pickle.name);
  try {
    if (this.page) {
      await this.page.screenshot({
        path: path.join(this.evidenceDirectory, `${fileName}.png`),
        fullPage: true,
      });
    }
  } catch (error) {
    console.warn('Could not save scenario screenshot:', error.message);
  } finally {
    try {
      await this.context?.close();
      if (video) {
        await rename(await video.path(), path.join(this.evidenceDirectory, `${fileName}.webm`));
      }
    } catch (error) {
      console.warn('Could not save scenario video:', error.message);
    } finally {
      await this.browser?.close();
    }
  }
});