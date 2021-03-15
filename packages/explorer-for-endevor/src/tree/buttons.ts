import { CommandId } from '../commands/id';
import { AddNewProfileNode } from '../_doc/ElementTree';

export const addNewProfileButton: AddNewProfileNode = {
  type: 'BUTTON_ADD_PROFILE',
  label: 'Add a New Profile',
  command: {
    title: 'Add a New Profile',
    command: CommandId.ADD_NEW_SERVICE,
  },
};
