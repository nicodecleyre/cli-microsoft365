import assert from 'assert';
import sinon from 'sinon';
import auth from '../../../../Auth.js';
import { cli } from '../../../../cli/cli.js';
import { CommandInfo } from '../../../../cli/CommandInfo.js';
import { Logger } from '../../../../cli/Logger.js';
import { CommandError } from '../../../../Command.js';
import config from '../../../../config.js';
import request from '../../../../request.js';
import { telemetry } from '../../../../telemetry.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import { spo } from '../../../../utils/spo.js';
import commands from '../../commands.js';
import command from './hubsite-rights-grant.js';

describe(commands.HUBSITE_RIGHTS_GRANT, () => {
  let log: string[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;
  let loggerLogToStderrSpy: sinon.SinonSpy;

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
    sinon.stub(spo, 'getRequestDigest').resolves({
      FormDigestValue: 'ABC',
      FormDigestTimeoutSeconds: 1800,
      FormDigestExpiresAt: new Date(),
      WebFullUrl: 'https://contoso.sharepoint.com'
    });
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
    loggerLogSpy = sinon.spy(logger, 'log');
    loggerLogToStderrSpy = sinon.spy(logger, 'logToStderr');
  });

  afterEach(() => {
    sinonUtil.restore([
      request.post
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
    auth.connection.spoUrl = undefined;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.HUBSITE_RIGHTS_GRANT);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('grants rights on the specified site design to the specified principal', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_vti_bin/client.svc/ProcessQuery`) > -1 &&
        opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="37" ObjectPathId="36" /><Method Name="GrantHubSiteRights" Id="38" ObjectPathId="36"><Parameters><Parameter Type="String">https://contoso.sharepoint.com/sites/sales</Parameter><Parameter Type="Array"><Object Type="String">admin</Object></Parameter><Parameter Type="Enum">1</Parameter></Parameters></Method></Actions><ObjectPaths><Constructor Id="36" TypeId="{268004ae-ef6b-4e9b-8425-127220d84719}" /></ObjectPaths></Request>`) {
        return JSON.stringify([
          {
            "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.7310.1205", "ErrorInfo": null, "TraceCorrelationId": "1fbd439e-5090-5000-c29b-037f60060808"
          }, 37, {
            "IsNull": false
          }
        ]);
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { hubSiteUrl: 'https://contoso.sharepoint.com/sites/sales', principals: 'admin', rights: 'Join' } });
    assert(loggerLogSpy.notCalled);
  });

  it('grants rights on the specified site design to the specified principal (debug)', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_vti_bin/client.svc/ProcessQuery`) > -1 &&
        opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="37" ObjectPathId="36" /><Method Name="GrantHubSiteRights" Id="38" ObjectPathId="36"><Parameters><Parameter Type="String">https://contoso.sharepoint.com/sites/sales</Parameter><Parameter Type="Array"><Object Type="String">admin</Object></Parameter><Parameter Type="Enum">1</Parameter></Parameters></Method></Actions><ObjectPaths><Constructor Id="36" TypeId="{268004ae-ef6b-4e9b-8425-127220d84719}" /></ObjectPaths></Request>`) {
        return JSON.stringify([
          {
            "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.7310.1205", "ErrorInfo": null, "TraceCorrelationId": "1fbd439e-5090-5000-c29b-037f60060808"
          }, 37, {
            "IsNull": false
          }
        ]);
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { debug: true, hubSiteUrl: 'https://contoso.sharepoint.com/sites/sales', principals: 'admin', rights: 'Join' } });
    assert(loggerLogToStderrSpy.called);
  });

  it('grants rights on the specified site design to the specified principals', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_vti_bin/client.svc/ProcessQuery`) > -1 &&
        opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="37" ObjectPathId="36" /><Method Name="GrantHubSiteRights" Id="38" ObjectPathId="36"><Parameters><Parameter Type="String">https://contoso.sharepoint.com/sites/sales</Parameter><Parameter Type="Array"><Object Type="String">admin</Object><Object Type="String">user</Object></Parameter><Parameter Type="Enum">1</Parameter></Parameters></Method></Actions><ObjectPaths><Constructor Id="36" TypeId="{268004ae-ef6b-4e9b-8425-127220d84719}" /></ObjectPaths></Request>`) {
        return JSON.stringify([
          {
            "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.7310.1205", "ErrorInfo": null, "TraceCorrelationId": "1fbd439e-5090-5000-c29b-037f60060808"
          }, 37, {
            "IsNull": false
          }
        ]);
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { hubSiteUrl: 'https://contoso.sharepoint.com/sites/sales', principals: 'admin,user', rights: 'Join' } });
    assert(loggerLogSpy.notCalled);
  });

  it('grants rights on the specified site design to the specified principals (email)', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_vti_bin/client.svc/ProcessQuery`) > -1 &&
        opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="37" ObjectPathId="36" /><Method Name="GrantHubSiteRights" Id="38" ObjectPathId="36"><Parameters><Parameter Type="String">https://contoso.sharepoint.com/sites/sales</Parameter><Parameter Type="Array"><Object Type="String">admin@contoso.onmicrosoft.com</Object><Object Type="String">user@contoso.onmicrosoft.com</Object></Parameter><Parameter Type="Enum">1</Parameter></Parameters></Method></Actions><ObjectPaths><Constructor Id="36" TypeId="{268004ae-ef6b-4e9b-8425-127220d84719}" /></ObjectPaths></Request>`) {
        return JSON.stringify([
          {
            "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.7310.1205", "ErrorInfo": null, "TraceCorrelationId": "1fbd439e-5090-5000-c29b-037f60060808"
          }, 37, {
            "IsNull": false
          }
        ]);
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { hubSiteUrl: 'https://contoso.sharepoint.com/sites/sales', principals: 'admin@contoso.onmicrosoft.com,user@contoso.onmicrosoft.com', rights: 'Join' } });
    assert(loggerLogSpy.notCalled);
  });

  it('grants rights on the specified site design to the specified principals separated with an extra space', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_vti_bin/client.svc/ProcessQuery`) > -1 &&
        opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="37" ObjectPathId="36" /><Method Name="GrantHubSiteRights" Id="38" ObjectPathId="36"><Parameters><Parameter Type="String">https://contoso.sharepoint.com/sites/sales</Parameter><Parameter Type="Array"><Object Type="String">admin</Object><Object Type="String">user</Object></Parameter><Parameter Type="Enum">1</Parameter></Parameters></Method></Actions><ObjectPaths><Constructor Id="36" TypeId="{268004ae-ef6b-4e9b-8425-127220d84719}" /></ObjectPaths></Request>`) {
        return JSON.stringify([
          {
            "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.7310.1205", "ErrorInfo": null, "TraceCorrelationId": "1fbd439e-5090-5000-c29b-037f60060808"
          }, 37, {
            "IsNull": false
          }
        ]);
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { hubSiteUrl: 'https://contoso.sharepoint.com/sites/sales', principals: 'admin, user', rights: 'Join' } });
    assert(loggerLogSpy.notCalled);
  });

  it('escapes XML in user input', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_vti_bin/client.svc/ProcessQuery`) > -1 &&
        opts.data === `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="${config.applicationName}" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009"><Actions><ObjectPath Id="37" ObjectPathId="36" /><Method Name="GrantHubSiteRights" Id="38" ObjectPathId="36"><Parameters><Parameter Type="String">https://contoso.sharepoint.com/sites/sales&gt;</Parameter><Parameter Type="Array"><Object Type="String">admin&gt;</Object></Parameter><Parameter Type="Enum">1</Parameter></Parameters></Method></Actions><ObjectPaths><Constructor Id="36" TypeId="{268004ae-ef6b-4e9b-8425-127220d84719}" /></ObjectPaths></Request>`) {
        return JSON.stringify([
          {
            "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.7310.1205", "ErrorInfo": null, "TraceCorrelationId": "1fbd439e-5090-5000-c29b-037f60060808"
          }, 37, {
            "IsNull": false
          }
        ]);
      }

      throw 'Invalid request';
    });

    await command.action(logger, { options: { hubSiteUrl: 'https://contoso.sharepoint.com/sites/sales>', principals: 'admin>', rights: 'Join' } });
    assert(loggerLogSpy.notCalled);
  });

  it('correctly handles API error', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_vti_bin/client.svc/ProcessQuery`) > -1) {
        return JSON.stringify([
          {
            "SchemaVersion": "15.0.0.0", "LibraryVersion": "16.0.7310.1205", "ErrorInfo": {
              "ErrorMessage": "File Not Found.", "ErrorValue": null, "TraceCorrelationId": "86be439e-80c4-5000-fcf8-b746bccdc4e7", "ErrorCode": -2147024894, "ErrorTypeName": "System.IO.FileNotFoundException"
            }, "TraceCorrelationId": "86be439e-80c4-5000-fcf8-b746bccdc4e7"
          }
        ]);
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { hubSiteUrl: 'https://contoso.sharepoint.com/sites/sales', principals: 'admin', rights: 'Join' } } as any),
      new CommandError('File Not Found.'));
  });

  it('fails validation if url is not a valid SharePoint URL', async () => {
    const actual = await command.validate({ options: { hubSiteUrl: 'abc', principals: 'admin', rights: 'Join' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if specified rights value is invalid', async () => {
    const actual = await command.validate({ options: { hubSiteUrl: 'https://contoso.sharepoint.com/sites/sales', principals: 'PattiF', rights: 'Invalid' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if all required parameters are valid', async () => {
    const actual = await command.validate({ options: { hubSiteUrl: 'https://contoso.sharepoint.com/sites/sales', principals: 'PattiF', rights: 'Join' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation if all required parameters are valid (multiple principals)', async () => {
    const actual = await command.validate({ options: { hubSiteUrl: 'https://contoso.sharepoint.com/sites/sales', principals: 'PattiF,AdeleV', rights: 'Join' } }, commandInfo);
    assert.strictEqual(actual, true);
  });
});
