import { COMMAND_PREFIX } from '../constants';

export const CommandId = {
  PRINT_ELEMENT: `${COMMAND_PREFIX}.printElement`,
  REFRESH_TREE_VIEW: `${COMMAND_PREFIX}.refreshTreeView`,
  ADD_NEW_SERVICE: `${COMMAND_PREFIX}.addNewService`,
  ADD_NEW_ELEMENT_LOCATION: `${COMMAND_PREFIX}.addNewElementLocation`,
  HIDE_ELEMENT_LOCATION: `${COMMAND_PREFIX}.hideElementLocation`,
  HIDE_SERVICE: `${COMMAND_PREFIX}.hideService`,
  VIEW_ELEMENT_DETAILS: `${COMMAND_PREFIX}.viewElementDetails`,
  RETRIEVE_ELEMENT: `${COMMAND_PREFIX}.retrieveElement`,
  RETRIEVE_WITH_DEPENDENCIES: `${COMMAND_PREFIX}.retrieveElementWithDependencies`,
  QUICK_EDIT_ELEMENT: `${COMMAND_PREFIX}.quickEditElement`,
  GENERATE_ELEMENT: `${COMMAND_PREFIX}.generateElement`,
};
