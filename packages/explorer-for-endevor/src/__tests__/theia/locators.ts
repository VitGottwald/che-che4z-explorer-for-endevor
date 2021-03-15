export const TheiaLocator = {
  theiaUrl: 'http://localhost:3000',

  terminalMenuXpath: "(//li[@class='p-MenuBar-item'])[8]",

  newTerminalOptionXpath: "(//li[@data-command='terminal:new'])",
};

export const EndevorProfileLocator = {
  endevorExplorerId: 'shell-tab-plugin-view-container:e4eExplorerContainer',

  addProfileId: '/0:Add a New Profile',

  emptyInputBox: "//input[@class='input empty']",

  endevorProfileId: '/1:EndevorTestProfile',

  refreshTreeId:
    '__plugin-view-container:e4eExplorerContainer_title:__plugin.view.title.action.e4e.refreshTreeView',
};

export const EndevorLocationProfileLocator = {
  addLocationProfileXpath: "//div[@title='Add a New Location Profile']",

  emptyInputBox: "//input[@class='input empty']",

  endevorLocationProfileId:
    '/1:EndevorTestProfile/0:EndevorTestLocationProfile',
};
