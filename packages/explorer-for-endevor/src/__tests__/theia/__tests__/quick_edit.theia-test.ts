import * as driverChrome from '../quick_edit.theia';

const SLEEPTIME = 10000;
const SHORTSLEEPTIME = 2000;

describe('Add Endevor Profiles', () => {
  beforeAll(async () => {
    await driverChrome.openBrowser();
    await driverChrome.sleepTime(SHORTSLEEPTIME);
    await driverChrome.OpenTheiaInChrome();
    await driverChrome.sleepTime(SLEEPTIME);
  });

  it('Should Add Endevor Profile', async () => {
    const profileName = await driverChrome.addEndevorProfile(
      'EndevorTestProfile'
    );
    await driverChrome.sleepTime(SHORTSLEEPTIME);
    expect(profileName).toEqual('EndevorTestProfile');
  });

  it('Should Add Endevor Location Profile', async () => {
    const profileName = await driverChrome.addEndevorLocationProfile(
      'EndevorTestLocationProfile'
    );
    await driverChrome.sleepTime(SHORTSLEEPTIME);
    expect(profileName).toEqual('EndevorTestLocationProfile');
  });

  afterAll(async () => driverChrome.closeBrowser());
});
