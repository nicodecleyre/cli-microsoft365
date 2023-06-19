import * as chalk from 'chalk';
import { Cli } from '../../../../cli/Cli';
import { Logger } from '../../../../cli/Logger';
import config from '../../../../config';
import GlobalOptions from '../../../../GlobalOptions';
import request from '../../../../request';
import { formatting } from '../../../../utils/formatting';
import { ClientSvcResponse, ClientSvcResponseContents, FormDigestInfo, spo, SpoOperation } from '../../../../utils/spo';
import { validation } from '../../../../utils/validation';
import { aadGroup } from '../../../../utils/aadGroup';
import SpoCommand from '../../../base/SpoCommand';
import commands from '../../commands';

interface CommandArgs {
  options: Options;
}

interface Options extends GlobalOptions {
  url: string;
  skipRecycleBin?: boolean;
  fromRecycleBin?: boolean;
  wait: boolean;
  confirm?: boolean;
}

class SpoSiteRemoveCommand extends SpoCommand {
  private context?: FormDigestInfo;
  private spoAdminUrl?: string;

  public get name(): string {
    return commands.SITE_REMOVE;
  }

  public get description(): string {
    return 'Removes the specified site';
  }

  constructor() {
    super();

    this.#initTelemetry();
    this.#initOptions();
    this.#initValidators();
  }

  #initTelemetry(): void {
    this.telemetry.push((args: CommandArgs) => {
      Object.assign(this.telemetryProperties, {
        skipRecycleBin: (!(!args.options.skipRecycleBin)).toString(),
        fromRecycleBin: (!(!args.options.fromRecycleBin)).toString(),
        wait: args.options.wait,
        confirm: (!(!args.options.confirm)).toString()
      });
    });
  }

  #initOptions(): void {
    this.options.unshift(
      {
        option: '-u, --url <url>'
      },
      {
        option: '--skipRecycleBin'
      },
      {
        option: '--fromRecycleBin'
      },
      {
        option: '--wait'
      },
      {
        option: '--confirm'
      }
    );
  }

  #initValidators(): void {
    this.validators.push(
      async (args: CommandArgs) => validation.isValidSharePointUrl(args.options.url)
    );
  }

  public async commandAction(logger: Logger, args: CommandArgs): Promise<void> {
    if (args.options.confirm) {
      await this.removeSite(logger, args);
    }
    else {
      const result = await Cli.prompt<{ continue: boolean }>({
        type: 'confirm',
        name: 'continue',
        default: false,
        message: `Are you sure you want to remove the site ${args.options.url}?`
      });

      if (result.continue) {
        await this.removeSite(logger, args);
      }
    }
  }

  private async removeSite(logger: Logger, args: CommandArgs): Promise<void> {
    try {
      if (args.options.fromRecycleBin) {
        await this.deleteSiteWithoutGroup(logger, args);
      }
      else {
        const groupId = await this.getSiteGroupId(args.options.url, logger);
        if (groupId === '00000000-0000-0000-0000-000000000000') {
          if (this.debug) {
            logger.logToStderr('Site is not groupified. Going ahead with the conventional site deletion options');
          }

          await this.deleteSiteWithoutGroup(logger, args);
        }
        else {
          if (this.debug) {
            logger.logToStderr(`Site attached to group ${groupId}. Initiating group delete operation via Graph API`);
          }

          try {
            const group = await aadGroup.getGroupById(groupId);
            if (args.options.skipRecycleBin || args.options.wait) {
              logger.logToStderr(chalk.yellow(`Entered site is a groupified site. Hence, the parameters 'skipRecycleBin' and 'wait' will not be applicable.`));
            }

            await this.deleteGroup(group.id, logger);
            await this.deleteSite(args.options.url, args.options.wait, logger);
          }
          catch (err: any) {
            if (this.verbose) {
              logger.logToStderr(`Site group doesn't exist. Searching in the Microsoft 365 deleted groups.`);
            }

            const deletedGroups = await this.isSiteGroupDeleted(groupId);
            if (deletedGroups.value.length === 0) {
              if (this.verbose) {
                logger.logToStderr("Site group doesn't exist anymore. Deleting the site.");
              }

              if (args.options.wait) {
                logger.logToStderr(chalk.yellow(`Entered site is a groupified site. Hence, the parameter 'wait' will not be applicable.`));
              }

              await this.deleteOrphanedSite(logger, args.options.url);
            }
            else {
              throw `Site group still exists in the deleted groups. The site won't be removed.`;
            }
          }
        }
      }
    }
    catch (err: any) {
      this.handleRejectedPromise(err);
    }
  }

  private isSiteGroupDeleted(groupId: string): Promise<{ value: { id: string }[] }> {
    const requestOptions: any = {
      url: `https://graph.microsoft.com/v1.0/directory/deletedItems/Microsoft.Graph.Group?$select=id&$filter=groupTypes/any(c:c+eq+'Unified') and startswith(id, '${groupId}')`,
      headers: {
        accept: 'application/json;odata.metadata=none'
      },
      responseType: 'json'
    };

    return request.get<{ value: { id: string }[] }>(requestOptions);
  }

  private async deleteOrphanedSite(logger: Logger, url: string): Promise<void> {
    const spoAdminUrl: string = await spo.getSpoAdminUrl(logger, this.debug);
    const requestOptions: any = {
      url: `${spoAdminUrl}/_api/GroupSiteManager/Delete?siteUrl='${url}'`,
      headers: {
        'content-type': 'application/json;odata=nometadata',
        accept: 'application/json;odata=nometadata'
      },
      responseType: 'json'
    };

    const response: any = await request.post(requestOptions);

    return response;
  }

  private async deleteSiteWithoutGroup(logger: Logger, args: CommandArgs): Promise<void> {
    const spoAdminUrl = await spo.getSpoAdminUrl(logger, this.debug);
    this.spoAdminUrl = spoAdminUrl;

    const res = await spo.ensureFormDigest(this.spoAdminUrl, logger, this.context, this.debug);
    this.context = res;

    if (args.options.fromRecycleBin) {
      if (this.verbose) {
        logger.logToStderr(`Deleting site from recycle bin ${args.options.url}...`);
      }

      await this.deleteSiteFromTheRecycleBin(args.options.url, args.options.wait, logger);
    }
    else {
      await this.deleteSite(args.options.url, args.options.wait, logger);
    }

    if (args.options.skipRecycleBin) {
      if (this.verbose) {
        logger.logToStderr(`Also deleting site from tenant recycle bin ${args.options.url}...`);
      }

      await this.deleteSiteFromTheRecycleBin(args.options.url, args.options.wait, logger);

    }
  }

  private deleteSite(url: string, wait: boolean, logger: Logger): Promise<void> {
    return new Promise<void>((resolve: () => void, reject: (error: any) => void): void => {
      spo
        .ensureFormDigest(this.spoAdminUrl as string, logger, this.context, this.debug)
        .then((res: FormDigestInfo): Promise<string> => {
          this.context = res;

          if (this.verbose) {
            logger.logToStderr(`Deleting site ${url}...`);
          }

          const requestOptions: any = {
            url: `${this.spoAdminUrl}/_vti_bin/client.svc/ProcessQuery`,
            headers: {
              'X-RequestDigest': this.context.FormDigestValue
            },
            data: `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="55" ObjectPathId="54"/><ObjectPath Id="57" ObjectPathId="56"/><Query Id="58" ObjectPathId="54"><Query SelectAllProperties="true"><Properties/></Query></Query><Query Id="59" ObjectPathId="56"><Query SelectAllProperties="false"><Properties><Property Name="IsComplete" ScalarProperty="true"/><Property Name="PollingInterval" ScalarProperty="true"/></Properties></Query></Query></Actions><ObjectPaths><Constructor Id="54" TypeId="{268004ae-ef6b-4e9b-8425-127220d84719}"/><Method Id="56" ParentId="54" Name="RemoveSite"><Parameters><Parameter Type="String">${formatting.escapeXml(url)}</Parameter></Parameters></Method></ObjectPaths></Request>`
          };

          return request.post(requestOptions);
        })
        .then((res: string): void => {
          const json: ClientSvcResponse = JSON.parse(res);
          const response: ClientSvcResponseContents = json[0];
          if (response.ErrorInfo) {
            reject(response.ErrorInfo.ErrorMessage);
          }
          else {
            const operation: SpoOperation = json[json.length - 1];
            const isComplete: boolean = operation.IsComplete;
            if (!wait || isComplete) {
              resolve();
              return;
            }

            setTimeout(() => {
              spo.waitUntilFinished({
                operationId: JSON.stringify(operation._ObjectIdentity_),
                siteUrl: this.spoAdminUrl as string,
                resolve,
                reject,
                logger,
                currentContext: this.context as FormDigestInfo,
                debug: this.debug,
                verbose: this.verbose
              });
            }, operation.PollingInterval);
          }
        });
    });
  }

  private deleteSiteFromTheRecycleBin(url: string, wait: boolean, logger: Logger): Promise<void> {
    return new Promise<void>((resolve: () => void, reject: (error: any) => void): void => {
      spo
        .ensureFormDigest(this.spoAdminUrl as string, logger, this.context, this.debug)
        .then((res: FormDigestInfo): Promise<string> => {
          this.context = res;

          const requestOptions: any = {
            url: `${this.spoAdminUrl}/_vti_bin/client.svc/ProcessQuery`,
            headers: {
              'X-RequestDigest': this.context.FormDigestValue
            },
            data: `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="185" ObjectPathId="184" /><Query Id="186" ObjectPathId="184"><Query SelectAllProperties="false"><Properties><Property Name="IsComplete" ScalarProperty="true" /><Property Name="PollingInterval" ScalarProperty="true" /></Properties></Query></Query></Actions><ObjectPaths><Method Id="184" ParentId="175" Name="RemoveDeletedSite"><Parameters><Parameter Type="String">${formatting.escapeXml(url)}</Parameter></Parameters></Method><Constructor Id="175" TypeId="{268004ae-ef6b-4e9b-8425-127220d84719}" /></ObjectPaths></Request>`
          };

          return request.post(requestOptions);
        })
        .then((res: string): void => {
          const json: ClientSvcResponse = JSON.parse(res);
          const response: ClientSvcResponseContents = json[0];
          if (response.ErrorInfo) {
            reject(response.ErrorInfo.ErrorMessage);
          }
          else {
            const operation: SpoOperation = json[json.length - 1];
            const isComplete: boolean = operation.IsComplete;
            if (!wait || isComplete) {
              resolve();
              return;
            }

            setTimeout(() => {
              spo.waitUntilFinished({
                operationId: JSON.stringify(operation._ObjectIdentity_),
                siteUrl: this.spoAdminUrl as string,
                resolve,
                reject,
                logger,
                currentContext: this.context as FormDigestInfo,
                debug: this.debug,
                verbose: this.verbose
              });
            }, operation.PollingInterval);
          }
        });
    });
  }

  private async getSiteGroupId(url: string, logger: Logger): Promise<string> {
    const _spoAdminUrl: string = await spo.getSpoAdminUrl(logger, this.debug);

    this.spoAdminUrl = _spoAdminUrl;
    const res: FormDigestInfo = await spo.ensureFormDigest(this.spoAdminUrl, logger, this.context, this.debug);


    this.context = res;
    if (this.verbose) {
      logger.logToStderr(`Retrieving the group Id of the site ${url}`);
    }

    const requestOptions: any = {
      url: `${this.spoAdminUrl as string}/_vti_bin/client.svc/ProcessQuery`,
      headers: {
        'X-RequestDigest': this.context.FormDigestValue
      },
      data: `<Request xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009" AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}"><Actions><ObjectPath Id="4" ObjectPathId="3"/><Query Id="5" ObjectPathId="3"><Query SelectAllProperties="false"><Properties><Property Name="GroupId" ScalarProperty="true"/></Properties></Query></Query></Actions><ObjectPaths><Constructor Id="1" TypeId="{268004ae-ef6b-4e9b-8425-127220d84719}"/><Method Id="3" ParentId="1" Name="GetSitePropertiesByUrl"><Parameters><Parameter Type="String">${formatting.escapeXml(url)}</Parameter></Parameters></Method></ObjectPaths></Request>`
    };

    const res1: string = await request.post(requestOptions);


    const json: ClientSvcResponse = JSON.parse(res1);
    const response: ClientSvcResponseContents = json[0];
    if (response.ErrorInfo) {
      throw response.ErrorInfo.ErrorMessage;
    }
    else {
      const groupId: string = json[json.length - 1].GroupId.replace('/Guid(', '').replace(')/', '');
      return groupId;
    }
  }

  private deleteGroup(groupId: string | undefined, logger: Logger): Promise<void> {
    if (this.verbose) {
      logger.logToStderr(`Removing Microsoft 365 Group: ${groupId}...`);
    }

    const requestOptions: any = {
      url: `https://graph.microsoft.com/v1.0/groups/${groupId}`,
      headers: {
        'accept': 'application/json;odata.metadata=none'
      }
    };

    return request.delete(requestOptions);
  }
}

module.exports = new SpoSiteRemoveCommand();