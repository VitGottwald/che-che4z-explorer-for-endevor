import {
  askForElementLocationOrCreateNew,
  dialogCancelled,
  locationChosen,
} from '../dialogs/locations/endevorElementLocationDialogs';
import { logger } from '../globals';
import { addElementLocation, getLocations } from '../settings/settings';
import { getInstanceNames } from '../endevor';
import { ServerNode } from '../_doc/ElementTree';
import { getEndevorServiceByName } from '../services/services';
import {
  createEndevorElementLocation,
  getElementLocationNames,
} from '../element-locations/elementLocations';

export const addNewElementLocation = async ({
  name: serviceName,
}: ServerNode): Promise<void> => {
  logger.trace('Add a New Location Profile was called.');
  const service = await getEndevorServiceByName(serviceName);
  if (!service) {
    return;
  }
  const allElementLocations = await getElementLocationNames();
  const alreadyAddedElementLocations = getLocations()
    .filter((location) => location.service === serviceName)
    .flatMap((location) => location.elementLocations);
  const elementLocations = await filterForUnusedLocations(
    allElementLocations,
    alreadyAddedElementLocations
  );
  const dialogResult = await askForElementLocationOrCreateNew(
    elementLocations,
    () => getInstanceNames(service.location)
  );
  if (dialogCancelled(dialogResult)) {
    logger.trace('No location profile was selected or newly created.');
    return;
  } else {
    let locationName;
    if (locationChosen(dialogResult)) {
      locationName = dialogResult;
    } else {
      const createdLocation = dialogResult;
      locationName = createdLocation.name;
      try {
        await createEndevorElementLocation(locationName, createdLocation.value);
      } catch (error) {
        logger.error(
          `Something went wrong with location profile: ${locationName} saving`,
          error.message
        );
        return;
      }
    }
    return addElementLocation(locationName, serviceName);
  }
};

const filterForUnusedLocations = async (
  allLocations: ReadonlyArray<string>,
  alreadyAddedLocations: ReadonlyArray<string>
): Promise<ReadonlyArray<string>> => {
  return allLocations.filter(
    (location) => !alreadyAddedLocations.includes(location)
  );
};
