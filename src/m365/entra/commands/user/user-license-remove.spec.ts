import assert from 'assert';
import sinon from 'sinon';
import auth from '../../../../Auth.js';
import { CommandError } from '../../../../Command.js';
import { cli } from '../../../../cli/cli.js';
import { CommandInfo } from '../../../../cli/CommandInfo.js';
import { Logger } from '../../../../cli/Logger.js';
import request from '../../../../request.js';
import { telemetry } from '../../../../telemetry.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import commands from '../../commands.js';
import command from './user-license-remove.js';

describe(commands.USER_LICENSE_REMOVE, () => {
  let commandInfo: CommandInfo;
  //#region Mocked Responses
  const validUserId = '3a081d91-5ea8-40a7-8ac9-abbaa3fcb893';
  const validUserName = 'John.Doe@contoso.com';
  const validIds = "45715bb8-13f9-4bf6-927f-ef96c102d394,0118A350-71FC-4EC3-8F0C-6A1CB8867561";
  const validIdsSingle = '45715bb8-13f9-4bf6-927f-ef96c102d394';
  //#endregion

  let log: string[];
  let logger: Logger;
  let promptIssued: boolean = false;

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').resolves();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
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
    sinon.stub(cli, 'promptForConfirmation').callsFake(() => {
      promptIssued = true;
      return Promise.resolve(false);
    });

    promptIssued = false;
  });

  afterEach(() => {
    sinonUtil.restore([
      request.post,
      cli.promptForConfirmation
    ]);
  });

  after(() => {
    sinon.restore();
    auth.connection.active = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.USER_LICENSE_REMOVE);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('fails validation if ids is not a valid guid.', async () => {
    const actual = await command.validate({
      options: {
        ids: 'Invalid GUID', userId: validUserId
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if userId is not a valid guid.', async () => {
    const actual = await command.validate({
      options: {
        ids: validIds, userId: 'Invalid GUID'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation when userName is not a valid upn', async () => {
    const actual = await command.validate({
      options: {
        ids: validIds, userName: 'Invalid upn'
      }
    }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if required options specified (userId)', async () => {
    const actual = await command.validate({ options: { ids: validIds, userId: validUserId } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation if required options specified (userName)', async () => {
    const actual = await command.validate({ options: { ids: validIds, userName: validUserName } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('prompts before removing the specified user licenses when force option not passed', async () => {
    await command.action(logger, {
      options: {
        ids: validIds,
        userId: validUserId
      }
    });

    assert(promptIssued);
  });

  it('aborts removing the specified user licenses when force option not passed and prompt not confirmed', async () => {
    const postSpy = sinon.spy(request, 'delete');
    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(false);

    await command.action(logger, {
      options: {
        ids: validIds,
        userId: validUserId
      }
    });
    assert(postSpy.notCalled);
  });

  it('removes a single user license by userId without confirmation prompt', async () => {
    const postSpy = sinon.stub(request, 'post').callsFake(async opts => {
      if ((opts.url === `https://graph.microsoft.com/v1.0/users/${validUserId}/assignLicense`)) {
        return;
      }

      throw `Invalid request ${opts.url}`;
    });

    await command.action(logger, { options: { userId: validUserId, ids: validIdsSingle, force: true } });
    assert(postSpy.called);
  });

  it('removes the specified user licenses by userName when prompt confirmed', async () => {
    const postSpy = sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/users/${validUserName}/assignLicense`) {
        return;
      }

      throw 'Invalid request';
    });

    sinonUtil.restore(cli.promptForConfirmation);
    sinon.stub(cli, 'promptForConfirmation').resolves(true);

    await command.action(logger, {
      options: {
        verbose: true, userName: validUserName, ids: validIds
      }
    });
    assert(postSpy.called);
  });

  it('removes the specified user licenses by userId without confirmation prompt', async () => {
    const postSpy = sinon.stub(request, 'post').callsFake(async (opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/users/${validUserId}/assignLicense`) {
        return;
      }

      throw 'Invalid request';
    });

    await command.action(logger, {
      options: {
        verbose: true, userId: validUserId, ids: validIds, force: true
      }
    });
    assert(postSpy.called);
  });

  it('fails when removing one license is not a valid company license', async () => {
    const error = {
      error: {
        message: 'License 0118a350-71fc-4ec3-8f0c-6a1cb8867561 does not correspond to a valid company License.'
      }
    };

    sinon.stub(request, 'post').callsFake(async opts => {
      if ((opts.url === `https://graph.microsoft.com/v1.0/users/${validUserId}/assignLicense`)) {
        throw error;
      }

      throw `Invalid request ${opts.url}`;
    });

    await assert.rejects(command.action(logger, {
      options: {
        verbose: true, userId: validUserId, ids: validIdsSingle, force: true
      }
    }), new CommandError(error.error.message));
  });

  it('correctly handles random API error', async () => {
    const error = {
      error: {
        message: 'The license cannot be removes.'
      }
    };
    sinon.stub(request, 'post').callsFake(async () => { throw error; });

    await assert.rejects(command.action(logger, {
      options: {
        userName: validUserName, ids: validIds, force: true
      }
    }), new CommandError(error.error.message));
  });
});
