import { Group } from "@microsoft/microsoft-graph-types";
import request, { CliRequestOptions } from "../request.js";
import { formatting } from "./formatting.js";
import { odata } from "./odata.js";
import { Logger } from '../cli/Logger.js';

const graphResource = 'https://graph.microsoft.com';

export const aadGroup = {
  /**
   * Retrieve a single group.
   * @param id Group ID.
   */
  getGroupById(id: string): Promise<Group> {
    const requestOptions: CliRequestOptions = {
      url: `${graphResource}/v1.0/groups/${id}`,
      headers: {
        accept: 'application/json;odata.metadata=none'
      },
      responseType: 'json'
    };

    return request.get<Group>(requestOptions);
  },

  /**
   * Get a list of groups by display name.
   * @param displayName Group display name.
   */
  getGroupsByDisplayName(displayName: string): Promise<Group[]> {
    return odata.getAllItems<Group>(`${graphResource}/v1.0/groups?$filter=displayName eq '${formatting.encodeQueryParameter(displayName)}'`);
  },

  /**
   * Get a single group by its display name.
   * @param displayName Group display name.
   * @throws Error when group was not found.
   * @throws Error when multiple groups with the same name were found.
   */
  async getGroupByDisplayName(displayName: string): Promise<Group> {
    const groups = await this.getGroupsByDisplayName(displayName);

    if (!groups.length) {
      throw Error(`The specified group '${displayName}' does not exist.`);
    }

    if (groups.length > 1) {
      throw Error(`Multiple groups with name '${displayName}' found: ${groups.map(x => x.id).join(',')}.`);
    }

    return groups[0];
  },

  /**
   * Get id of a group by its display name.
   * @param displayName Group display name.
   * @throws Error when group was not found.
   * @throws Error when multiple groups with the same name were found.
   */
  async getGroupIdByDisplayName(displayName: string): Promise<string> {
    const groups = await odata.getAllItems<Group>(`${graphResource}/v1.0/groups?$filter=displayName eq '${formatting.encodeQueryParameter(displayName)}'&$select=id`);

    if (!groups.length) {
      throw Error(`The specified group '${displayName}' does not exist.`);
    }

    if (groups.length > 1) {
      throw Error(`Multiple groups with name '${displayName}' found: ${groups.map(x => x.id).join(',')}.`);
    }

    return groups[0].id!;
  },

  /**
* Updates a group.
* @param id The group id
* @param isPrivate Set if you want to make te group private
* @param displayName The displayName it should be
* @param description The description it should be
* @param logger The logger object
* @param verbose set if verbose logging should be logged 
*/
  async setGroup(id: string, isPrivate?: boolean, displayName?: string, description?: string, logger?: Logger, verbose?: boolean): Promise<void> {
    if (verbose && logger) {
      logger.logToStderr(`Updating Microsoft 365 Group ${id}...`);
    }

    const update: Group = {};
    if (displayName) {
      update.displayName = displayName;
    }
    if (description) {
      update.description = description;
    }
    if (typeof isPrivate !== 'undefined') {
      update.visibility = isPrivate ? 'Private' : 'Public';
    }

    const requestOptions: CliRequestOptions = {
      url: `${graphResource}/v1.0/groups/${id}`,
      headers: {
        'accept': 'application/json;odata.metadata=none'
      },
      responseType: 'json',
      data: update
    };

    await request.patch(requestOptions);
  }
};