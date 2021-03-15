import { EndevorElement } from '@local/endevor/_doc/Endevor';

export const renderElementAttributes = (
  element: EndevorElement
) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${element.elmName} - Details</title>
</head>
<body>
  <table>
    <tr>
      <td> envName </td>
      <td>: ${element.envName} </td>
    </tr>
    <tr>
      <td> stgNum </td>
      <td>: ${element.stgNum} </td>
    </tr>
    <tr>
      <td> sysName </td>
      <td>: ${element.sysName} </td>
    </tr>
    <tr>
      <td> sbsName </td>
      <td>: ${element.sbsName} </td>
    </tr>
    <tr>
      <td> typeName </td>
      <td>: ${element.typeName} </td>
    </tr>
    <tr>
      <td> elmName </td>
      <td>: ${element.elmName} </td>
    </tr>
    <tr>
      <td> fileExt </td>
      <td>: ${element.fileExt} </td>
    </tr>
  </table>
</body>
</html>`;
