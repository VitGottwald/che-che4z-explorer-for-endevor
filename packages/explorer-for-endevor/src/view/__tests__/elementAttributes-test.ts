import { EndevorElement } from '@local/endevor/_doc/Endevor';
import { renderElementAttributes } from '../elementAttributes';
import * as cheerio from 'cheerio';

describe('renderElementAttributes', () => {
  it('renders a row for each endevor element attribute', () => {
    // arrange
    const element: EndevorElement = {
      envName: 'DEV',
      stgNum: '1',
      sysName: 'SYSTEM',
      sbsName: 'SUBSYS',
      typeName: 'ASMPGM',
      elmName: 'ELEMENT',
      fileExt: 'cbl',
    };

    // act
    const html = renderElementAttributes(element);

    // assert
    const $ = cheerio.load(html);
    const rowsCount = $('tr').length;
    expect(rowsCount).toBe(Object.keys(element).length);
  });
});
