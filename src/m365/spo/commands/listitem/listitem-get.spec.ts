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
import { urlUtil } from '../../../../utils/urlUtil.js';
import commands from '../../commands.js';
import command from './listitem-get.js';
import { settingsNames } from '../../../../settingsNames.js';

describe(commands.LISTITEM_GET, () => {
  const webUrl = 'https://contoso.sharepoint.com/sites/project-x';
  const listUrl = 'sites/project-x/documents';
  const listTitle = 'Demo List';
  const listServerRelativeUrl: string = urlUtil.getServerRelativePath(webUrl, listUrl);

  let log: any[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;

  const expectedTitle = `List Item 1`;
  const expectedId = 147;
  const expectedUniqueId = 'ea093c7b-8ae6-4400-8b75-e2d01154dffc';

  let actualId = 0;

  const getFakes = async (opts: any) => {
    if (opts.url === `https://contoso.sharepoint.com/sites/project-x/_api/web/GetList('${formatting.encodeQueryParameter(listServerRelativeUrl)}')/items(147)/RoleAssignments?$expand=Member,RoleDefinitionBindings` ||
      opts.url === `https://contoso.sharepoint.com/sites/project-x/_api/web/lists/getByTitle('${formatting.encodeQueryParameter(listTitle)}')/items(147)/RoleAssignments?$expand=Member,RoleDefinitionBindings`
    ) {
      return {
        "value": [
          {
            "Member": {
              "Id": 3,
              "IsHiddenInUI": false,
              "LoginName": "Communication site Owners",
              "Title": "Communication site Owners",
              "PrincipalType": 8,
              "AllowMembersEditMembership": false,
              "AllowRequestToJoinLeave": false,
              "AutoAcceptRequestToJoinLeave": false,
              "Description": null,
              "OnlyAllowMembersViewMembership": false,
              "OwnerTitle": "Communication site Owners",
              "RequestToJoinLeaveEmailSetting": ""
            },
            "RoleDefinitionBindings": [
              {
                "BasePermissions": {
                  "High": "2147483647",
                  "Low": "4294967295"
                },
                "Description": "Has full control.",
                "Hidden": false,
                "Id": 1073741829,
                "Name": "Full Control",
                "Order": 1,
                "RoleTypeKind": 5
              }
            ],
            "PrincipalId": 3
          }
        ]
      };
    }

    if (opts.url === `https://contoso.sharepoint.com/sites/project-x/_api/web/lists/getByTitle('Demo%20List')/GetItemByUniqueId(guid'ea093c7b-8ae6-4400-8b75-e2d01154dffc')?$select=`) {
      return {
        "Attachments": false,
        "AuthorId": 3,
        "ContentTypeId": "0x0100B21BD271A810EE488B570BE49963EA34",
        "Created": "2018-03-15T10:43:10Z",
        "EditorId": 3,
        "GUID": "ea093c7b-8ae6-4400-8b75-e2d01154dffc",
        "ID": 147,
        "Modified": "2018-03-15T10:43:10Z",
        "Title": expectedTitle
      };
    }

    if (opts.url.indexOf('/_api/web/lists') > -1) {
      if ((opts.url as string).indexOf('/items(') > -1) {
        actualId = parseInt(opts.url.match(/\/items\((\d+)\)/i)[1]);
        return {
          "Attachments": false,
          "AuthorId": 3,
          "ContentTypeId": "0x0100B21BD271A810EE488B570BE49963EA34",
          "Created": "2018-03-15T10:43:10Z",
          "EditorId": 3,
          "GUID": "ea093c7b-8ae6-4400-8b75-e2d01154dffc",
          "ID": actualId,
          "Modified": "2018-03-15T10:43:10Z",
          "Title": expectedTitle
        };
      }
    }

    if (opts.url === `https://contoso.sharepoint.com/sites/project-x/_api/web/GetList('${formatting.encodeQueryParameter(listServerRelativeUrl)}')/items(147)?$select=${formatting.encodeQueryParameter('Title,Modified')}`) {
      actualId = parseInt(opts.url.match(/\/items\((\d+)\)/i)[1]);
      return {
        "Attachments": false,
        "AuthorId": 3,
        "ContentTypeId": "0x0100B21BD271A810EE488B570BE49963EA34",
        "Created": "2018-03-15T10:43:10Z",
        "EditorId": 3,
        "GUID": "ea093c7b-8ae6-4400-8b75-e2d01154dffc",
        "ID": actualId,
        "Modified": "2018-03-15T10:43:10Z",
        "Title": expectedTitle
      };
    }

    throw 'Invalid request';
  };

  before(() => {
    sinon.stub(auth, 'restoreAuth').callsFake(() => Promise.resolve());
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').callsFake(() => '');
    sinon.stub(session, 'getId').callsFake(() => '');
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
    loggerLogSpy = sinon.spy(logger, 'log');
  });

  afterEach(() => {
    sinonUtil.restore([
      request.get,
      cli.getSettingWithDefaultValue
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name.startsWith(commands.LISTITEM_GET), true);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
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

  it('configures command types', () => {
    assert.notStrictEqual(typeof command.types, 'undefined', 'command types undefined');
    assert.notStrictEqual(command.types.string, 'undefined', 'command string types undefined');
  });

  it('fails validation if listTitle, listId or listUrl option not specified', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', id: expectedId } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if listTitle, listId and listUrl are specified together', async () => {
    sinon.stub(cli, 'getSettingWithDefaultValue').callsFake((settingName, defaultValue) => {
      if (settingName === settingsNames.prompt) {
        return false;
      }

      return defaultValue;
    });

    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listTitle: 'Demo List', listId: '0CD891EF-AFCE-4E55-B836-FCE03286CCCF', listUrl: listUrl, id: expectedId } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if the webUrl option is not a valid SharePoint site URL', async () => {
    const actual = await command.validate({ options: { webUrl: 'foo', listTitle: 'Demo List', id: expectedId } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if the webUrl option is a valid SharePoint site URL', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listTitle: 'Demo List', id: expectedId } }, commandInfo);
    assert(actual);
  });

  it('fails validation if the listId option is not a valid GUID', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listId: 'foo', id: expectedId } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if the listId option is a valid GUID', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listId: '0CD891EF-AFCE-4E55-B836-FCE03286CCCF', id: expectedId } }, commandInfo);
    assert(actual);
  });

  it('fails validation if the uniqueId option is not a valid GUID', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listId: '0CD891EF-AFCE-4E55-B836-FCE03286CCCF', uniqueId: 'foo' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if the uniqueId option is a valid GUID', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listId: '0CD891EF-AFCE-4E55-B836-FCE03286CCCF', uniqueId: expectedUniqueId } }, commandInfo);
    assert(actual);
  });

  it('fails validation if the specified id is not a number', async () => {
    const actual = await command.validate({ options: { webUrl: 'https://contoso.sharepoint.com', listTitle: 'Demo List', id: 'a' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('returns listItemInstance object by id when list item is requested', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    command.allowUnknownOptions();

    const options: any = {
      debug: true,
      listTitle: 'Demo List',
      webUrl: webUrl,
      id: expectedId
    };

    await command.action(logger, { options: options } as any);
    assert.strictEqual(actualId, expectedId);
  });

  it('returns listItemInstance object by uniqueId when list item is requested', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    command.allowUnknownOptions();

    const options: any = {
      debug: true,
      listTitle: 'Demo List',
      webUrl: webUrl,
      uniqueId: expectedUniqueId
    };

    await command.action(logger, { options: options } as any);
    assert(loggerLogSpy.calledWith({
      Attachments: false,
      AuthorId: 3,
      ContentTypeId: '0x0100B21BD271A810EE488B570BE49963EA34',
      Created: '2018-03-15T10:43:10Z',
      EditorId: 3,
      GUID: 'ea093c7b-8ae6-4400-8b75-e2d01154dffc',
      Modified: '2018-03-15T10:43:10Z',
      Title: expectedTitle
    }));
  });

  it('returns listItemInstance object when list item is requested and with permissions', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    command.allowUnknownOptions();

    const options: any = {
      debug: true,
      listTitle: 'Demo List',
      webUrl: webUrl,
      id: expectedId,
      withPermissions: true
    };

    await command.action(logger, { options: options } as any);
    assert.strictEqual(actualId, expectedId);
  });

  it('returns listItemInstance object when list item is requested with an output type of json, and a list of fields are specified', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    command.allowUnknownOptions();

    const options: any = {
      listTitle: 'Demo List',
      webUrl: webUrl,
      id: expectedId,
      output: "json",
      properties: "ID,Modified"
    };

    await command.action(logger, { options: options } as any);
    assert.strictEqual(actualId, expectedId);
  });

  it('returns listItemInstance object when list item is requested with an output type of json, a list of fields with lookup field are specified', async () => {
    sinon.stub(request, 'get').callsFake(async (opts: any) => {
      if ((opts.url as string).indexOf('&$expand=') > -1) {
        actualId = parseInt(opts.url.match(/\/items\((\d+)\)/i)[1]);
        return {
          "ID": actualId,
          "Modified": "2018-03-15T10:43:10Z",
          "Title": expectedTitle,
          "Company": `{ "Title": "Contoso" }`
        };
      }

      throw 'Invalid request';
    });

    command.allowUnknownOptions();

    const options: any = {
      listTitle: 'Demo List',
      webUrl: webUrl,
      id: expectedId,
      output: "json",
      properties: "Title,Modified,Company/Title"
    };

    await command.action(logger, { options: options } as any);
    assert.deepStrictEqual(JSON.stringify(loggerLogSpy.lastCall.args[0]), JSON.stringify({
      "Modified": "2018-03-15T10:43:10Z",
      "Title": expectedTitle,
      "Company": `{ "Title": "Contoso" }`
    }));
  });

  it('returns listItemInstance object when list item is requested with an output type of text, and no list of fields', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    command.allowUnknownOptions();

    const options: any = {
      listTitle: 'Demo List',
      webUrl: webUrl,
      id: expectedId,
      output: "text"
    };

    await command.action(logger, { options: options } as any);
    assert.strictEqual(actualId, expectedId);
  });

  it('returns listItemInstance object when list item is requested with an output type of text, and a list of fields specified', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    command.allowUnknownOptions();

    const options: any = {
      listId: '0CD891EF-AFCE-4E55-B836-FCE03286CCCF',
      webUrl: webUrl,
      id: expectedId,
      output: "json"
    };

    await command.action(logger, { options: options } as any);
    assert.strictEqual(actualId, expectedId);
  });

  it('returns listItemInstance object when list item is requested with an output type of text from a list specified by url, and a list of fields are being specified', async () => {
    sinon.stub(request, 'get').callsFake(getFakes);

    command.allowUnknownOptions();

    const options: any = {
      verbose: true,
      webUrl: webUrl,
      id: expectedId,
      listUrl: listUrl,
      output: 'json',
      properties: 'Title,Modified'
    };

    await command.action(logger, { options: options } as any);
    assert.strictEqual(actualId, expectedId);
  });

  it('correctly handles random API error', async () => {
    sinon.stub(request, 'get').callsFake(() => Promise.reject('An error has occurred'));

    const options: any = {
      listId: '0CD891EF-AFCE-4E55-B836-FCE03286CCCF',
      webUrl: webUrl,
      id: expectedId,
      output: "json"
    };

    await assert.rejects(command.action(logger, { options: options } as any),
      new CommandError('An error has occurred'));
  });
});
