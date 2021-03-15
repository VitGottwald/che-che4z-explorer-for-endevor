import { Builder, By, Key, until, ThenableWebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import {
  TheiaLocator,
  EndevorProfileLocator,
  EndevorLocationProfileLocator,
} from './locators';
import * as dotenv from 'dotenv';
dotenv.config();

let driverChrome: ThenableWebDriver;
const SHORTSLEEPTIME = 2000;

const getEndevorUrl = (url: string) => {
  const endevor_url = process.env.ENDEVOR_URL;
  if (!endevor_url)
    throw new Error(`Environment variable ${url} was not defined in .env`);
  return endevor_url;
};
const getEndevorUser = (user: string) => {
  const endevor_user = process.env.ENDEVOR_USER;
  if (!endevor_user)
    throw new Error(`Environment variable ${user} was not defined in .env`);
  return endevor_user;
};
const getEndevorPass = (pass: string) => {
  const endevor_password = process.env.ENDEVOR_PASS;
  if (!endevor_password)
    throw new Error(`Environment variable ${pass} was not defined in .env`);
  return endevor_password;
};

const endevor_url = getEndevorUrl('ENDEVOR_URL');
const endevor_username = getEndevorUser('ENDEVOR_USER');
const endevor_password = getEndevorPass('ENDEVOR_PASS');

export async function openBrowser() {
  const chromeOptions = new chrome.Options();
  chromeOptions.addArguments('headless');
  chromeOptions.addArguments('window-size=1200,1100');
  driverChrome = new Builder()
    .forBrowser('chrome')
    .setChromeOptions(chromeOptions)
    .build();
}

export async function OpenTheiaInChrome() {
  await driverChrome.get(TheiaLocator.theiaUrl);
}

export async function sleepTime(sleeptime: number) {
  await driverChrome.sleep(sleeptime);
}

export function closeBrowser() {
  driverChrome.close();
}

export async function addEndevorProfile(endevorProfileName: string) {
  await driverChrome
    .wait(until.elementLocated(By.id(EndevorProfileLocator.endevorExplorerId)))
    .click();
  await driverChrome
    .wait(until.elementLocated(By.id(EndevorProfileLocator.addProfileId)))
    .click();
  await driverChrome.sleep(SHORTSLEEPTIME);
  const createProfile = await driverChrome.wait(
    until.elementLocated(By.xpath(EndevorProfileLocator.emptyInputBox))
  );
  createProfile.sendKeys(Key.ENTER);
  await driverChrome.sleep(SHORTSLEEPTIME);
  const profileName = await driverChrome.wait(
    until.elementLocated(By.xpath(EndevorProfileLocator.emptyInputBox))
  );
  profileName.sendKeys(endevorProfileName);
  profileName.sendKeys(Key.ENTER);
  await driverChrome.sleep(SHORTSLEEPTIME);
  const url = await driverChrome.wait(
    until.elementLocated(By.xpath(EndevorProfileLocator.emptyInputBox))
  );
  url.sendKeys(endevor_url);
  url.sendKeys(Key.ENTER);
  await driverChrome.sleep(SHORTSLEEPTIME);
  const username = await driverChrome.wait(
    until.elementLocated(By.xpath(EndevorProfileLocator.emptyInputBox))
  );
  username.sendKeys(endevor_username);
  username.sendKeys(Key.ENTER);
  await driverChrome.sleep(SHORTSLEEPTIME);
  const password = await driverChrome.wait(
    until.elementLocated(By.xpath(EndevorProfileLocator.emptyInputBox))
  );
  password.sendKeys(endevor_password);
  password.sendKeys(Key.ENTER);
  await driverChrome.sleep(SHORTSLEEPTIME);
  const authorizedConnection = await driverChrome.wait(
    until.elementLocated(By.xpath(EndevorProfileLocator.emptyInputBox))
  );
  authorizedConnection.sendKeys('False');
  authorizedConnection.sendKeys(Key.ENTER);
  await driverChrome.sleep(SHORTSLEEPTIME);
  await driverChrome
    .wait(until.elementLocated(By.id(EndevorProfileLocator.refreshTreeId)))
    .click();
  const createdProfileName = await driverChrome
    .wait(until.elementLocated(By.id(EndevorProfileLocator.endevorProfileId)))
    .getText();
  return createdProfileName;
}

export async function addEndevorLocationProfile(
  endevorLocationProfileName: string
) {
  await driverChrome
    .wait(until.elementLocated(By.id(EndevorProfileLocator.endevorProfileId)))
    .click();
  await driverChrome
    .wait(
      until.elementLocated(
        By.xpath(EndevorLocationProfileLocator.addLocationProfileXpath)
      )
    )
    .click();
  await driverChrome.sleep(SHORTSLEEPTIME);
  const createProfile = await driverChrome.wait(
    until.elementLocated(By.xpath(EndevorLocationProfileLocator.emptyInputBox))
  );
  createProfile.sendKeys(Key.ENTER);
  await driverChrome.sleep(SHORTSLEEPTIME);
  const profileName = await driverChrome.wait(
    until.elementLocated(By.xpath(EndevorLocationProfileLocator.emptyInputBox))
  );
  profileName.sendKeys(endevorLocationProfileName);
  profileName.sendKeys(Key.ENTER);
  await driverChrome.sleep(SHORTSLEEPTIME);
  const instance = await driverChrome.wait(
    until.elementLocated(By.xpath(EndevorLocationProfileLocator.emptyInputBox))
  );
  instance.sendKeys('WEBSMFTS');
  instance.sendKeys(Key.ENTER);
  await driverChrome.sleep(SHORTSLEEPTIME);
  const endevorPath = await driverChrome.wait(
    until.elementLocated(By.xpath(EndevorLocationProfileLocator.emptyInputBox))
  );
  endevorPath.sendKeys('SMPLPROD/1/FINANCE/ACCTREC/*');
  endevorPath.sendKeys(Key.ENTER);
  await driverChrome.sleep(SHORTSLEEPTIME);
  const ccid = await driverChrome.wait(
    until.elementLocated(By.xpath(EndevorLocationProfileLocator.emptyInputBox))
  );
  ccid.sendKeys('');
  ccid.sendKeys(Key.ENTER);
  await driverChrome.sleep(SHORTSLEEPTIME);
  const comment = await driverChrome.wait(
    until.elementLocated(By.xpath(EndevorLocationProfileLocator.emptyInputBox))
  );
  comment.sendKeys('');
  comment.sendKeys(Key.ENTER);
  await driverChrome.sleep(SHORTSLEEPTIME);
  await driverChrome
    .wait(until.elementLocated(By.id(EndevorProfileLocator.refreshTreeId)))
    .click();
  const createdProfileName = await driverChrome
    .wait(
      until.elementLocated(
        By.id(EndevorLocationProfileLocator.endevorLocationProfileId)
      )
    )
    .getText();
  return createdProfileName;
}
