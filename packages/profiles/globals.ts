import * as path from 'path';
import * as os from 'os';

export const getProfilesDir = () => {
  const home = process.env['ZOWE_CLI_HOME'] || os.homedir();
  const zoweDir = path.join(home, '.zowe');
  const profilesDir = path.join(zoweDir, 'profiles');

  return profilesDir;
};
