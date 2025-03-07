import assert from 'assert';
import sinon from 'sinon';
import auth from '../../../../Auth.js';
import { cli } from '../../../../cli/cli.js';
import { CommandInfo } from '../../../../cli/CommandInfo.js';
import { Logger } from '../../../../cli/Logger.js';
import { CommandError } from '../../../../Command.js';
import request from '../../../../request.js';
import { telemetry } from '../../../../telemetry.js';
import { formatting } from '../../../../utils/formatting.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import { spo } from '../../../../utils/spo.js';
import { urlUtil } from '../../../../utils/urlUtil.js';
import commands from '../../commands.js';
import command from './listitem-record-undeclare.js';
import { settingsNames } from '../../../../settingsNames.js';

describe(commands.LISTITEM_RECORD_UNDECLARE, () => {
  const webUrl = 'https://contoso.sharepoint.com/sites/project-x';
  const listUrl = '/sites/project-x/lists/TestList';
  const listServerRelativeUrl: string = urlUtil.getServerRelativePath(webUrl, listUrl);

  let log: any[];
  let logger: Logger;
  let commandInfo: CommandInfo;
  const postFakes = async (opts: any) => {
    if ((opts.url as string).indexOf('_vti_bin/client.svc/ProcessQuery') > -1) {
      // requestObjectIdentity mock
      if (opts.data.indexOf('Name="Current"') > -1) {
        if ((opts.url as string).indexOf('rejectme.com') > -1) {
          throw 'Failed request';
        }
        if ((opts.url as string).indexOf('returnerror.com') > -1) {
          return JSON.stringify(
            [{ "ErrorInfo": "error occurred" }]
          );
        }

        return JSON.stringify(
          [
            {
              "SchemaVersion": "15.0.0.0",
              "LibraryVersion": "16.0.7618.1204",
              "ErrorInfo": null,
              "TraceCorrelationId": "3e3e629e-30cc-5000-9f31-cf83b8e70021"
            },
            {
              "_ObjectType_": "SP.Web",
              "_ObjectIdentity_": "d704ae73-d5ed-459e-80b0-b8103c5fb6e0|8f2be65d-f195-4699-b0de-24aca3384ba9:site:0ead8b78-89e5-427f-b1bc-6e5a77ac191c:web:4c076c07-e3f1-49a8-ad01-dbb70b263cd7",
              "ServerRelativeUrl": "\\u002fsites\\u002fprojectx"
            }
          ]);
      }
      if (opts.data.indexOf('Name="UndeclareItemAsRecord') > -1) {
        return;
      }
    }
    throw 'Invalid request';
  };

  const getFakes = async (opts: any) => {
    if (opts.url === `${webUrl}/_api/web/GetList('${formatting.encodeQueryParameter(listServerRelativeUrl)}')?$select=Id`) {
      return { Id: '81f0ecee-75a8-46f0-b384-c8f4f9f31d99' };
    }

    if ((opts.url as string).indexOf('?$select=Id') > -1) {
      return { Id: "f64041f2-9818-4b67-92ff-3bc5dbbef27e" };
    }
    throw 'Invalid request';
  };

  before(() => {
    sinon.stub(auth, 'restoreAuth').callsFake(() => Promise.resolve());
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').callsFake(() => '');
    sinon.stub(session, 'getId').callsFake(() => '');
    sinon.stub(spo, 'getRequestDigest').callsFake(() => Promise.resolve({
      FormDigestValue: 'ABC',
      FormDigestTimeoutSeconds: 1800,
      FormDigestExpiresAt: new Date(),
      WebFullUrl: 'https://contoso.sharepoint.com'
    }));
    auth.connection.active = true;
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
      request.post,
      request.get,
      cli.getSettingWithDefaultValue
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name.startsWith(commands.LISTITEM_RECORD_UNDECLARE), true);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('fails to get _ObjecttIdentity_ when an error is returned by the _ObjectIdentity_ CSOM request', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);
    sinon.stub(request, 'post').callsFake(postFakes);

    const options: any = {
      listTitle: 'Demo List',
      listItemId: 147,
      webUrl: 'https://returnerror.com/sites/project-y'
    };

    await assert.rejects(command.action(logger, { options: options } as any), new CommandError('ClientSvc unknown error'));
  });

  it('correctly undeclares list item as a record when listTitle is passed', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);
    sinon.stub(request, 'post').callsFake(postFakes);

    command.allowUnknownOptions();

    const options: any = {
      debug: true,
      listTitle: 'Demo List',
      listItemId: 47,
      webUrl: 'https://contoso.sharepoint.com/sites/project-x'
    };
    await command.action(logger, { options: options } as any);
  });

  it('correctly undeclares list item as a record when listUrl is passed', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);
    sinon.stub(request, 'post').callsFake(postFakes);

    command.allowUnknownOptions();

    const options: any = {
      debug: true,
      listUrl: listUrl,
      id: 47,
      webUrl: webUrl
    };
    await command.action(logger, { options: options } as any);
  });

  it('correctly undeclares list item as a record when listId is passed', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);
    sinon.stub(request, 'post').callsFake(postFakes);

    command.allowUnknownOptions();

    const options: any = {
      debug: true,
      listId: '770fe148-1d72-480e-8cde-f9d3832798b6',
      listItemId: 47,
      webUrl: 'https://contoso.sharepoint.com/sites/project-x'
    };
    await command.action(logger, { options: options } as any);
  });

  it('fails to undeclare a list item as a record when \'reject me\' values are used', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);
    sinon.stub(request, 'post').callsFake(postFakes);

    const options: any = {
      listTitle: 'Demo List',
      listItemId: 47,
      webUrl: 'https://rejectme.com/sites/project-y'
    };

    await assert.rejects(command.action(logger, { options: options } as any), new CommandError('Failed request'));
  });

  it('supports specifying URL', () => {
    const options = command.options;
    let containsTypeOption = false;
    options.forEach(o => {
      if (o.option.indexOf('<webUrl>') > -1) {
        containsTypeOption = true;
      }
    });
    assert(containsTypeOption);
  });

  it('fails validation if both id and title options are not passed', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listItemId: 1 } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if the url option is not a valid SharePoint site URL', async () => {
    const actual = await command.validate({ options: { webUrl: 'foo', listItemId: 1, listTitle: 'Documents' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if the url option is a valid SharePoint site URL', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listId: '0CD891EF-AFCE-4E55-B836-FCE03286CCCF', listItemId: 1 } }, commandInfo);
    assert(actual);
  });

  it('fails validation if the id option is not a valid GUID', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listId: '12345', listItemId: 1 } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if the id option is a valid GUID', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listId: '0CD891EF-AFCE-4E55-B836-FCE03286CCCF', listItemId: 1 } }, commandInfo);
    assert(actual);
  });

  it('fails validation if both id and title options are passed', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listId: '0CD891EF-AFCE-4E55-B836-FCE03286CCCF', listTitle: 'Documents', listItemId: 1 } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if id is not passed', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if id is not a number', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listItemId: 'abc', listId: '0CD891EF-AFCE-4E55-B836-FCE03286CCCF' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });
});
