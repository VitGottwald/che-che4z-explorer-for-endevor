import {
  askForServiceOrCreateNew,
  dialogCancelled,
  serviceChosen,
} from '../dialogs/locations/endevorServiceDialogs';
import { logger } from '../globals';
import {
  createEndevorService,
  getEndevorServiceNames,
} from '../services/services';
import {
  addService,
  getLocations as getUsedEndevorServices,
} from '../settings/settings';

export const addNewService = async (): Promise<void> => {
  logger.trace('Add a New Profile called.');
  const unusedServices = await getUnusedEndevorServiceLocations();
  const dialogResult = await askForServiceOrCreateNew(unusedServices);
  if (dialogCancelled(dialogResult)) {
    logger.trace('No profile was selected or newly created.');
    return;
  } else {
    let serviceName;
    if (serviceChosen(dialogResult)) {
      serviceName = dialogResult;
    } else {
      const createdService = dialogResult;
      serviceName = createdService.name;
      try {
        await createEndevorService(serviceName, createdService.value);
      } catch (err) {
        logger.error(
          `Something went wrong with profile: ${serviceName} saving`,
          err.message
        );
        return;
      }
    }
    return addService(serviceName);
  }
};

const getUnusedEndevorServiceLocations = async (): Promise<
  ReadonlyArray<string>
> => {
  const allServices = await getEndevorServiceNames();
  const usedServices = getUsedEndevorServices().map(
    (usedService) => usedService.service
  );
  return allServices.filter(
    (service) => !usedServices.find((usedService) => usedService === service)
  );
};
