import assert from 'assert';
import sinon from 'sinon';
import auth from '../../../../Auth.js';
import { cli } from '../../../../cli/cli.js';
import { CommandInfo } from '../../../../cli/CommandInfo.js';
import { Logger } from '../../../../cli/Logger.js';
import { CommandError, CommandErrorWithOutput } from '../../../../Command.js';
import { telemetry } from '../../../../telemetry.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import commands from '../../commands.js';
import spoSiteAddCommand from '../site/site-add.js';
import spoSiteGetCommand from '../site/site-get.js';
import spoSiteRemoveCommand from '../site/site-remove.js';
import command from './tenant-appcatalog-add.js';
import spoTenantAppCatalogUrlGetCommand from './tenant-appcatalogurl-get.js';

describe(commands.TENANT_APPCATALOG_ADD, () => {
  let log: any[];
  let logger: Logger;
  let commandInfo: CommandInfo;

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
    auth.connection.active = true;
    auth.connection.spoUrl = 'https://contoso.sharepoint.com';
    commandInfo = cli.getCommandInfo(command);
  });

  beforeEach(() => {
    log = [];
    logger = {
      log: async (msg: string) => {
        log.push(msg);
      },
      logRaw: async (msg: string) => {
        log.push(msg);
      },
      logToStderr: async (msg: string) => {
        log.push(msg);
      }
    };
  });

  afterEach(() => {
    sinonUtil.restore([
      cli.executeCommand,
      cli.executeCommandWithOutput
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name.startsWith(commands.TENANT_APPCATALOG_ADD), true);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('creates app catalog when app catalog and site with different URL already exist and force used', async () => {
    sinon.stub(cli, 'executeCommand').callsFake(async (command, args) => {
      if (command === spoSiteRemoveCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog' ||
          args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      if (command === spoSiteAddCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw 'Invalid URL';
      }

      throw 'Unknown case';
    });
    sinon.stub(cli, 'executeCommandWithOutput').callsFake(async (command, args): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        return 'https://contoso.sharepoint.com/sites/old-app-catalog';
      }

      if (command === spoSiteGetCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog' ||
          args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });

    await command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog', force: true } } as any);
  });

  it('creates app catalog when app catalog and site with different URL already exist and force used (debug)', async () => {
    sinon.stub(cli, 'executeCommand').callsFake(async (command, args) => {
      if (command === spoSiteRemoveCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog' ||
          args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      if (command === spoSiteAddCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw 'Invalid URL';
      }

      throw 'Unknown case';
    });
    sinon.stub(cli, 'executeCommandWithOutput').callsFake(async (command, args): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        return {
          stdout: 'https://contoso.sharepoint.com/sites/old-app-catalog'
        };
      }

      if (command === spoSiteGetCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog' ||
          args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });

    await command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog', force: true, debug: true } } as any);
  });

  it('handles error when creating app catalog when app catalog and site with different URL already exist and force used failed', async () => {
    sinon.stub(cli, 'executeCommand').callsFake(async (command, args) => {
      if (command === spoSiteRemoveCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog' ||
          args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      if (command === spoSiteAddCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          throw new CommandError('An error has occurred');
        }

        throw 'Invalid URL';
      }

      throw 'Unknown case';
    });
    sinon.stub(cli, 'executeCommandWithOutput').callsFake(async (command, args): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        return 'https://contoso.sharepoint.com/sites/old-app-catalog';
      }

      if (command === spoSiteGetCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog' ||
          args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });

    await assert.rejects(command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog', force: true } } as any), new CommandError('An error has occurred'));
  });

  it('handles error when app catalog and site with different URL already exist, force used and deleting the existing site failed', async () => {
    sinon.stub(cli, 'executeCommand').callsFake(async (command, args) => {
      if (command === spoSiteRemoveCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog') {
          return;
        }
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          throw new CommandError('Error deleting site new-app-catalog');
        }

        throw new CommandError('Invalid URL');
      }

      if (command === spoSiteAddCommand) {
        throw 'Should not be called';
      }

      throw 'Unknown case';
    });
    sinon.stub(cli, 'executeCommandWithOutput').callsFake(async (command, args): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        return 'https://contoso.sharepoint.com/sites/old-app-catalog';
      }

      if (command === spoSiteGetCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog' ||
          args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });

    await assert.rejects(command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog', force: true } } as any), new CommandError('Error deleting site new-app-catalog'));
  });

  it('creates app catalog when app catalog already exists, site with different URL does not exist and force used', async () => {
    sinon.stub(cli, 'executeCommand').callsFake(async (command, args) => {
      if (command === spoSiteRemoveCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      if (command === spoSiteAddCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw 'Invalid URL';
      }

      throw 'Unknown case';
    });
    sinon.stub(cli, 'executeCommandWithOutput').callsFake(async (command, args): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        return 'https://contoso.sharepoint.com/sites/old-app-catalog';
      }

      if (command === spoSiteGetCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog') {
          return;
        }
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          throw new CommandErrorWithOutput(new CommandError('404 FILE NOT FOUND'));
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });

    await command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog', force: true } } as any);
  });

  it('creates app catalog when app catalog already exists, site with different URL does not exist and force used (debug)', async () => {
    sinon.stub(cli, 'executeCommand').callsFake(async (command, args) => {
      if (command === spoSiteRemoveCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      if (command === spoSiteAddCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw 'Invalid URL';
      }

      throw 'Unknown case';
    });
    sinon.stub(cli, 'executeCommandWithOutput').callsFake(async (command, args): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        return 'https://contoso.sharepoint.com/sites/old-app-catalog';
      }

      if (command === spoSiteGetCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog') {
          return;
        }
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          throw new CommandErrorWithOutput(new CommandError('404 FILE NOT FOUND'));
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });

    await command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog', force: true, debug: true } } as any);
  });

  it('handles error when creating app catalog when app catalog already exists, site with different URL does not exist and force used', async () => {
    sinon.stub(cli, 'executeCommand').callsFake(async (command, args) => {
      if (command === spoSiteRemoveCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      if (command === spoSiteAddCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          throw new CommandError('An error has occurred');
        }

        throw 'Invalid URL';
      }

      throw 'Unknown case';
    });
    sinon.stub(cli, 'executeCommandWithOutput').callsFake(async (command, args): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        return 'https://contoso.sharepoint.com/sites/old-app-catalog';
      }

      if (command === spoSiteGetCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog') {
          return;
        }
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          throw new CommandErrorWithOutput(new CommandError('404 FILE NOT FOUND'));
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });

    await assert.rejects(command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog', force: true, debug: true } } as any), new CommandError('An error has occurred'));
  });

  it('handles error when retrieving site with different URL failed and app catalog already exists, and force used', async () => {
    sinon.stub(cli, 'executeCommand').callsFake(async (command, args) => {
      if (command === spoSiteRemoveCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });
    sinon.stub(cli, 'executeCommandWithOutput').callsFake(async (command, args): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        return 'https://contoso.sharepoint.com/sites/old-app-catalog';
      }

      if (command === spoSiteGetCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog') {
          return;
        }
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          throw new CommandErrorWithOutput(new CommandError('An error has occurred'));
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });

    await assert.rejects(command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog', force: true, debug: true } } as any), new CommandError('An error has occurred'));
  });

  it('handles error when deleting existing app catalog failed', async () => {
    sinon.stub(cli, 'executeCommand').callsFake(async (command, args) => {
      if (command === spoSiteRemoveCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog') {
          throw new CommandError('An error has occurred');
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });
    sinon.stub(cli, 'executeCommandWithOutput').callsFake(async (command, args): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        return {
          stdout: 'https://contoso.sharepoint.com/sites/old-app-catalog'
        };
      }

      if (command === spoSiteGetCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });

    await assert.rejects(command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog', force: true } } as any), new CommandError('An error has occurred'));
  });

  it('handles error app catalog exists and no force used', async () => {
    sinon.stub(cli, 'executeCommandWithOutput').callsFake(async (command, args): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        return {
          stdout: 'https://contoso.sharepoint.com/sites/old-app-catalog'
        };
      }

      if (command === spoSiteGetCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });

    await assert.rejects(command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog' } } as any), new CommandError('Another site exists at https://contoso.sharepoint.com/sites/old-app-catalog'));
  });

  it('creates app catalog when app catalog does not exist, site with different URL already exists and force used', async () => {
    sinon.stub(cli, 'executeCommand').callsFake(async (command, args) => {
      if (command === spoSiteRemoveCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      if (command === spoSiteAddCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw 'Invalid URL';
      }

      throw 'Unknown case';
    });
    sinon.stub(cli, 'executeCommandWithOutput').callsFake(async (command, args): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        return 'https://contoso.sharepoint.com/sites/old-app-catalog';
      }

      if (command === spoSiteGetCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog') {
          throw new CommandErrorWithOutput(new CommandError('404 FILE NOT FOUND'));
        }
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });

    await command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog', force: true } } as any);
  });

  it('handles error when creating app catalog when app catalog does not exist, site with different URL already exists and force used', async () => {
    sinon.stub(cli, 'executeCommand').callsFake(async (command, args) => {
      if (command === spoSiteRemoveCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      if (command === spoSiteAddCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          throw new CommandError('An error has occurred');
        }

        throw 'Invalid URL';
      }

      throw 'Unknown case';
    });
    sinon.stub(cli, 'executeCommandWithOutput').callsFake(async (command, args): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        return 'https://contoso.sharepoint.com/sites/old-app-catalog';
      }

      if (command === spoSiteGetCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog') {
          throw new CommandErrorWithOutput(new CommandError('404 FILE NOT FOUND'));
        }
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });

    await assert.rejects(command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog', force: true } } as any), new CommandError('An error has occurred'));
  });

  it('handles error when deleting existing site, when app catalog does not exist, site with different URL already exists and force used', async () => {
    sinon.stub(cli, 'executeCommand').callsFake(async (command, args) => {
      if (command === spoSiteRemoveCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          throw new CommandError('An error has occurred');
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });
    sinon.stub(cli, 'executeCommandWithOutput').callsFake(async (command, args): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        return 'https://contoso.sharepoint.com/sites/old-app-catalog';
      }

      if (command === spoSiteGetCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog') {
          throw new CommandErrorWithOutput(new CommandError('404 FILE NOT FOUND'));
        }
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });

    await assert.rejects(command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog', force: true } } as any), new CommandError('An error has occurred'));
  });

  it('handles error when app catalog does not exist, site with different URL already exists and force not used', async () => {
    sinon.stub(cli, 'executeCommand').callsFake(() => {
      throw 'Unknown case';
    });
    sinon.stub(cli, 'executeCommandWithOutput').callsFake(async (command, args): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        return 'https://contoso.sharepoint.com/sites/old-app-catalog';
      }

      if (command === spoSiteGetCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog') {
          throw new CommandErrorWithOutput(new CommandError('404 FILE NOT FOUND'));
        }
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });

    await assert.rejects(command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog' } } as any), new CommandError('Another site exists at https://contoso.sharepoint.com/sites/new-app-catalog'));
  });

  it(`creates app catalog when app catalog and site with different URL don't exist`, async () => {
    sinon.stub(cli, 'executeCommand').callsFake(async (command, args) => {
      if (command === spoSiteAddCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw 'Invalid URL';
      }

      throw 'Unknown case';
    });
    sinon.stub(cli, 'executeCommandWithOutput').callsFake(async (command, args): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        return 'https://contoso.sharepoint.com/sites/old-app-catalog';
      }

      if (command === spoSiteGetCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog' ||
          args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog') {
          throw new CommandErrorWithOutput(new CommandError('404 FILE NOT FOUND'));
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });

    await command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog' } } as any);
  });

  it(`handles error when creating app catalog fails, when app catalog when app catalog does and site with different URL don't exist`, async () => {
    sinon.stub(cli, 'executeCommand').callsFake(async (command, args) => {
      if (command === spoSiteAddCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          throw new CommandError('An error has occurred');
        }

        throw 'Invalid URL';
      }

      throw 'Unknown case';
    });
    sinon.stub(cli, 'executeCommandWithOutput').callsFake(async (command, args): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        return 'https://contoso.sharepoint.com/sites/old-app-catalog';
      }

      if (command === spoSiteGetCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog' ||
          args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog') {
          throw new CommandErrorWithOutput(new CommandError('404 FILE NOT FOUND'));
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });

    await assert.rejects(command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog' } } as any), new CommandError('An error has occurred'));
  });

  it(`handles error when checking if the app catalog site exists`, async () => {
    sinon.stub(cli, 'executeCommand').callsFake(() => {
      throw 'Unknown case';
    });
    sinon.stub(cli, 'executeCommandWithOutput').callsFake(async (command, args): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        return {
          stdout: 'https://contoso.sharepoint.com/sites/old-app-catalog'
        };
      }

      if (command === spoSiteGetCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/old-app-catalog') {
          throw new CommandErrorWithOutput(new CommandError('An error has occurred'));
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });

    await assert.rejects(command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog' } } as any), new CommandError('An error has occurred'));
  });

  it(`creates app catalog when app catalog not registered, site with different URL exists and force used`, async () => {
    sinon.stub(cli, 'executeCommand').callsFake(async (command, args) => {
      if (command === spoSiteRemoveCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      if (command === spoSiteAddCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw 'Invalid URL';
      }

      throw 'Unknown case';
    });
    sinon.stub(cli, 'executeCommandWithOutput').callsFake(async (command, args): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        return '';
      }

      if (command === spoSiteGetCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });

    await command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog', force: true } } as any);
  });

  it(`creates app catalog when app catalog not registered, site with different URL exists and force used (debug)`, async () => {
    sinon.stub(cli, 'executeCommand').callsFake(async (command, args) => {
      if (command === spoSiteRemoveCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      if (command === spoSiteAddCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw 'Invalid URL';
      }

      throw 'Unknown case';
    });
    sinon.stub(cli, 'executeCommandWithOutput').callsFake(async (command, args): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        return '';
      }

      if (command === spoSiteGetCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });

    await command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog', force: true, debug: true } } as any);
  });

  it(`handles error when creating app catalog when app catalog not registered, site with different URL exists and force used`, async () => {
    sinon.stub(cli, 'executeCommand').callsFake(async (command, args) => {
      if (command === spoSiteRemoveCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      if (command === spoSiteAddCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          throw new CommandError('An error has occurred');
        }

        throw 'Invalid URL';
      }

      throw 'Unknown case';
    });
    sinon.stub(cli, 'executeCommandWithOutput').callsFake(async (command, args): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        return '';
      }

      if (command === spoSiteGetCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });

    await assert.rejects(command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog', force: true } } as any), new CommandError('An error has occurred'));
  });

  it(`handles error when deleting existing site when app catalog not registered, site with different URL exists and force used`, async () => {
    sinon.stub(cli, 'executeCommand').callsFake(async (command, args) => {
      if (command === spoSiteRemoveCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          throw new CommandError('An error has occurred');
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });
    sinon.stub(cli, 'executeCommandWithOutput').callsFake(async (command, args): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        return '';
      }

      if (command === spoSiteGetCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });

    await assert.rejects(command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog', force: true } } as any), new CommandError('An error has occurred'));
  });

  it(`handles error when app catalog not registered, site with different URL exists and force not used`, async () => {
    sinon.stub(cli, 'executeCommandWithOutput').callsFake(async (command, args): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        return '';
      }

      if (command === spoSiteGetCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });

    await assert.rejects(command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog' } } as any), new CommandError('Another site exists at https://contoso.sharepoint.com/sites/new-app-catalog'));
  });

  it(`creates app catalog when app catalog not registered and site with different URL doesn't exist`, async () => {
    sinon.stub(cli, 'executeCommand').callsFake(async (command, args) => {
      if (command === spoSiteAddCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          return;
        }

        throw 'Invalid URL';
      }

      throw 'Unknown case';
    });
    sinon.stub(cli, 'executeCommandWithOutput').callsFake(async (command, args): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        return '';
      }

      if (command === spoSiteGetCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          throw new CommandErrorWithOutput(new CommandError('404 FILE NOT FOUND'));
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });

    await command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog' } } as any);
  });

  it(`handles error when creating app catalog when app catalog not registered and site with different URL doesn't exist`, async () => {
    sinon.stub(cli, 'executeCommand').callsFake(async (command, args) => {
      if (command === spoSiteAddCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          throw new CommandError('An error has occurred');
        }

        throw 'Invalid URL';
      }

      throw 'Unknown case';
    });
    sinon.stub(cli, 'executeCommandWithOutput').callsFake(async (command, args): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        return '';
      }

      if (command === spoSiteGetCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          throw new CommandErrorWithOutput(new CommandError('404 FILE NOT FOUND'));
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });

    await assert.rejects(command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog' } } as any), new CommandError('An error has occurred'));
  });

  it(`handles error when app catalog not registered and checking if the site with different URL exists throws error`, async () => {
    sinon.stub(cli, 'executeCommandWithOutput').callsFake(async (command, args): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        return '';
      }

      if (command === spoSiteGetCommand) {
        if (args.options.url === 'https://contoso.sharepoint.com/sites/new-app-catalog') {
          throw new CommandErrorWithOutput(new CommandError('An error has occurred'));
        }

        throw new CommandError('Invalid URL');
      }

      throw 'Unknown case';
    });

    await assert.rejects(command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog' } } as any), new CommandError('An error has occurred'));
  });

  it(`handles error when checking if app catalog registered throws error`, async () => {
    sinon.stub(cli, 'executeCommandWithOutput').callsFake((command): Promise<any> => {
      if (command === spoTenantAppCatalogUrlGetCommand) {
        throw new CommandError('An error has occurred');
      }

      throw 'Unknown case';
    });

    await assert.rejects(command.action(logger, { options: { url: 'https://contoso.sharepoint.com/sites/new-app-catalog' } } as any), new CommandError('An error has occurred'));
  });

  it('fails validation if the specified url is not a valid SharePoint URL', async () => {
    const options: any = { url: 'abc', owner: 'user@contoso.com', timeZone: 4 };
    const actual = await command.validate({ options: options }, commandInfo);
    assert.strictEqual(typeof actual, 'string');
  });

  it('fails validation if timeZone is not a number', async () => {
    const options: any = { url: 'https://contoso.sharepoint.com/sites/apps', owner: 'user@contoso.com', timeZone: 'a' };
    const actual = await command.validate({ options: options }, commandInfo);
    assert.strictEqual(typeof actual, 'string');
  });

  it('passes validation when all options are specified and valid', async () => {
    const options: any = { url: 'https://contoso.sharepoint.com/sites/apps', owner: 'user@contoso.com', timeZone: 4 };
    const actual = await command.validate({ options: options }, commandInfo);
    assert.strictEqual(actual, true);
  });
});
