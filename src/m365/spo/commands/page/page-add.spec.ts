import assert from 'assert';
import sinon from 'sinon';
import auth from '../../../../Auth.js';
import { Cli } from '../../../../cli/Cli.js';
import { CommandInfo } from '../../../../cli/CommandInfo.js';
import { Logger } from '../../../../cli/Logger.js';
import { CommandError } from '../../../../Command.js';
import request from '../../../../request.js';
import { telemetry } from '../../../../telemetry.js';
import { pid } from '../../../../utils/pid.js';
import { session } from '../../../../utils/session.js';
import { sinonUtil } from '../../../../utils/sinonUtil.js';
import { spo } from '../../../../utils/spo.js';
import commands from '../../commands.js';
import command from './page-add.js';

describe(commands.PAGE_ADD, () => {
  let log: string[];
  let logger: Logger;
  let loggerLogSpy: sinon.SinonSpy;
  let commandInfo: CommandInfo;
  const fileResponse =
  {
    Attachments: false,
    AuthorId: 3,
    ContentTypeId: '0x0100B21BD271A810EE488B570BE49963EA34',
    Created: '2018-03-15T10:43:10Z',
    EditorId: 3,
    GUID: '9a94cb88-019b-4a66-abd6-be7f5337f659',
    ID: 6,
    Id: 6,
    Modified: '2018-03-15T10:52:10Z',
    Title: 'NewTitle'
  };

  before(() => {
    sinon.stub(auth, 'restoreAuth').resolves();
    sinon.stub(telemetry, 'trackEvent').returns();
    sinon.stub(pid, 'getProcessName').returns('');
    sinon.stub(session, 'getId').returns('');
    sinon.stub(spo, 'getRequestDigest').resolves({
      FormDigestValue: 'ABC',
      FormDigestTimeoutSeconds: 1800,
      FormDigestExpiresAt: new Date(),
      WebFullUrl: 'https://contoso.sharepoint.com'
    });
    auth.service.connected = true;
    commandInfo = Cli.getCommandInfo(command);
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
      request.post,
      spo.setListItem,
      spo.getFileAsListItemByUrl
    ]);
  });

  after(() => {
    sinon.restore();
    auth.service.connected = false;
  });

  it('has correct name', () => {
    assert.strictEqual(command.name, commands.PAGE_ADD);
  });

  it('has a description', () => {
    assert.notStrictEqual(command.description, null);
  });

  it('creates new modern page', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/web/getfolderbyserverrelativeurl('/sites/team-a/sitepages')/files/AddTemplateFile`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          urlOfFile: '/sites/team-a/sitepages/page.aspx',
          templateFileType: 3
        })) {
        return {
          "CheckInComment": "",
          "CheckOutType": 2,
          "ContentTag": "{64201083-46BA-4966-8BC5-B0CB31E3456C},1,0",
          "CustomizedPageStatus": 1,
          "ETag": "\"{64201083-46BA-4966-8BC5-B0CB31E3456C},1\"",
          "Exists": true,
          "IrmEnabled": false,
          "Length": "780",
          "Level": 2,
          "LinkingUri": null,
          "LinkingUrl": "",
          "MajorVersion": 0,
          "MinorVersion": 1,
          "Name": "page.aspx",
          "ServerRelativeUrl": "/sites/team-a/SitePages/page.aspx",
          "TimeCreated": "2018-03-18T20:44:17Z",
          "TimeLastModified": "2018-03-18T20:44:17Z",
          "Title": null,
          "UIVersion": 1,
          "UIVersionLabel": "0.1",
          "UniqueId": "64201083-46ba-4966-8bc5-b0cb31e3456c"
        };
      }

      if ((opts.url as string).indexOf(`/_api/web/getfilebyid('64201083-46ba-4966-8bc5-b0cb31e3456c')/ListItemAllFields`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          ContentTypeId: '0x0101009D1CB255DA76424F860D91F20E6C4118',
          Title: 'page',
          ClientSideApplicationId: 'b6917cb1-93a0-4b97-a84d-7cf49975d4ec',
          PageLayoutType: 'Article',
          PromotedState: 0,
          BannerImageUrl: {
            Description: '/_layouts/15/images/sitepagethumbnail.png',
            Url: `https://contoso.sharepoint.com/_layouts/15/images/sitepagethumbnail.png`
          }
        })) {
        return;
      }

      if ((opts.url as string).indexOf('_api/web/getfilebyid(\'64201083-46ba-4966-8bc5-b0cb31e3456c\')/ListItemAllFields/SetCommentsDisabled(true)') > -1) {
        return;
      }

      throw 'Invalid request';
    });

    sinon.stub(spo, 'setListItem').resolves();
    sinon.stub(spo, 'getFileAsListItemByUrl').resolves(fileResponse);

    await assert.rejects(command.action(logger, { options: { name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com/sites/team-a' } }));
    assert(loggerLogSpy.notCalled);
  });

  it('creates new modern page (debug)', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/web/getfolderbyserverrelativeurl('/sites/team-a/sitepages')/files/AddTemplateFile`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          urlOfFile: '/sites/team-a/sitepages/page.aspx',
          templateFileType: 3
        })) {
        return {
          "CheckInComment": "",
          "CheckOutType": 2,
          "ContentTag": "{64201083-46BA-4966-8BC5-B0CB31E3456C},1,0",
          "CustomizedPageStatus": 1,
          "ETag": "\"{64201083-46BA-4966-8BC5-B0CB31E3456C},1\"",
          "Exists": true,
          "IrmEnabled": false,
          "Length": "780",
          "Level": 2,
          "LinkingUri": null,
          "LinkingUrl": "",
          "MajorVersion": 0,
          "MinorVersion": 1,
          "Name": "page.aspx",
          "ServerRelativeUrl": "/sites/team-a/SitePages/page.aspx",
          "TimeCreated": "2018-03-18T20:44:17Z",
          "TimeLastModified": "2018-03-18T20:44:17Z",
          "Title": null,
          "UIVersion": 1,
          "UIVersionLabel": "0.1",
          "UniqueId": "64201083-46ba-4966-8bc5-b0cb31e3456c"
        };
      }

      if ((opts.url as string).indexOf(`/_api/sitepages/pages/GetByUrl('sitepages/page.aspx')/checkoutpage`) > -1) {
        return {
          Title: "page",
          Id: 1,
          BannerImageUrl: {
            Description: '/_layouts/15/images/sitepagethumbnail.png',
            Url: `https://contoso.sharepoint.com/_layouts/15/images/sitepagethumbnail.png`
          },
          CanvasContent1: "{}",
          layoutWebpartsContent: "{}"
        };
      }

      if ((opts.url as string).indexOf(`/_api/SitePages/Pages(1)/SavePage`) > -1) {
        return;
      }

      if ((opts.url as string).indexOf(`/_api/web/getfilebyid('64201083-46ba-4966-8bc5-b0cb31e3456c')/ListItemAllFields`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          ContentTypeId: '0x0101009D1CB255DA76424F860D91F20E6C4118',
          Title: 'page',
          ClientSideApplicationId: 'b6917cb1-93a0-4b97-a84d-7cf49975d4ec',
          PageLayoutType: 'Article',
          PromotedState: 0,
          BannerImageUrl: {
            Description: '/_layouts/15/images/sitepagethumbnail.png',
            Url: `https://contoso.sharepoint.com/_layouts/15/images/sitepagethumbnail.png`
          }
        })) {
        return;
      }

      if ((opts.url as string).indexOf('_api/web/getfilebyid(\'64201083-46ba-4966-8bc5-b0cb31e3456c\')/ListItemAllFields/SetCommentsDisabled(true)') > -1) {
        return;
      }

      throw 'Invalid request';
    });

    sinon.stub(spo, 'setListItem').resolves();
    sinon.stub(spo, 'getFileAsListItemByUrl').resolves(fileResponse);

    await command.action(logger, { options: { debug: true, name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com/sites/team-a' } });
  });

  it('creates new modern page on root of tenant (debug)', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/sitepages/pages/GetByUrl('sitepages/page.aspx')/checkoutpage`) > -1) {
        return {
          Title: "page",
          Id: 1,
          BannerImageUrl: {
            Description: '/_layouts/15/images/sitepagethumbnail.png',
            Url: `https://contoso.sharepoint.com/_layouts/15/images/sitepagethumbnail.png`
          },
          CanvasContent1: "{}",
          layoutWebpartsContent: "{}"
        };
      }

      if ((opts.url as string).indexOf(`/_api/SitePages/Pages(1)/SavePage`) > -1) {
        return;
      }

      if ((opts.url as string).indexOf(`/_api/web/getfolderbyserverrelativeurl('/sitepages')/files/AddTemplateFile`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          urlOfFile: '/sitepages/page.aspx',
          templateFileType: 3
        })) {
        return {
          "CheckInComment": "",
          "CheckOutType": 2,
          "ContentTag": "{64201083-46BA-4966-8BC5-B0CB31E3456C},1,0",
          "CustomizedPageStatus": 1,
          "ETag": "\"{64201083-46BA-4966-8BC5-B0CB31E3456C},1\"",
          "Exists": true,
          "IrmEnabled": false,
          "Length": "780",
          "Level": 2,
          "LinkingUri": null,
          "LinkingUrl": "",
          "MajorVersion": 0,
          "MinorVersion": 1,
          "Name": "page.aspx",
          "ServerRelativeUrl": "/SitePages/page.aspx",
          "TimeCreated": "2018-03-18T20:44:17Z",
          "TimeLastModified": "2018-03-18T20:44:17Z",
          "Title": null,
          "UIVersion": 1,
          "UIVersionLabel": "0.1",
          "UniqueId": "64201083-46ba-4966-8bc5-b0cb31e3456c"
        };
      }

      if ((opts.url as string).indexOf(`/_api/web/getfilebyid('64201083-46ba-4966-8bc5-b0cb31e3456c')/ListItemAllFields`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          ContentTypeId: '0x0101009D1CB255DA76424F860D91F20E6C4118',
          Title: 'page',
          ClientSideApplicationId: 'b6917cb1-93a0-4b97-a84d-7cf49975d4ec',
          PageLayoutType: 'Article',
          PromotedState: 0,
          BannerImageUrl: {
            Description: '/_layouts/15/images/sitepagethumbnail.png',
            Url: `https://contoso.sharepoint.com/_layouts/15/images/sitepagethumbnail.png`
          }
        })) {
        return;
      }

      if ((opts.url as string).indexOf('_api/web/getfilebyid(\'64201083-46ba-4966-8bc5-b0cb31e3456c\')/ListItemAllFields/SetCommentsDisabled(true)') > -1) {
        return;
      }

      throw 'Invalid request';
    });

    sinon.stub(spo, 'setListItem').resolves();
    sinon.stub(spo, 'getFileAsListItemByUrl').resolves(fileResponse);

    await command.action(logger, { options: { debug: true, name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com' } });
  });

  it('automatically appends the .aspx extension', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/web/getfolderbyserverrelativeurl('/sites/team-a/sitepages')/files/AddTemplateFile`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          urlOfFile: '/sites/team-a/sitepages/page.aspx',
          templateFileType: 3
        })) {
        return {
          "CheckInComment": "",
          "CheckOutType": 2,
          "ContentTag": "{64201083-46BA-4966-8BC5-B0CB31E3456C},1,0",
          "CustomizedPageStatus": 1,
          "ETag": "\"{64201083-46BA-4966-8BC5-B0CB31E3456C},1\"",
          "Exists": true,
          "IrmEnabled": false,
          "Length": "780",
          "Level": 2,
          "LinkingUri": null,
          "LinkingUrl": "",
          "MajorVersion": 0,
          "MinorVersion": 1,
          "Name": "page.aspx",
          "ServerRelativeUrl": "/sites/team-a/SitePages/page.aspx",
          "TimeCreated": "2018-03-18T20:44:17Z",
          "TimeLastModified": "2018-03-18T20:44:17Z",
          "Title": null,
          "UIVersion": 1,
          "UIVersionLabel": "0.1",
          "UniqueId": "64201083-46ba-4966-8bc5-b0cb31e3456c"
        };
      }

      if ((opts.url as string).indexOf(`/_api/web/getfilebyid('64201083-46ba-4966-8bc5-b0cb31e3456c')/ListItemAllFields`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          ContentTypeId: '0x0101009D1CB255DA76424F860D91F20E6C4118',
          Title: 'page',
          ClientSideApplicationId: 'b6917cb1-93a0-4b97-a84d-7cf49975d4ec',
          PageLayoutType: 'Article',
          PromotedState: 0,
          BannerImageUrl: {
            Description: '/_layouts/15/images/sitepagethumbnail.png',
            Url: `https://contoso.sharepoint.com/_layouts/15/images/sitepagethumbnail.png`
          }
        })) {
        return;
      }

      if ((opts.url as string).indexOf('_api/web/getfilebyid(\'64201083-46ba-4966-8bc5-b0cb31e3456c\')/ListItemAllFields/SetCommentsDisabled(true)') > -1) {
        return;
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { name: 'page', webUrl: 'https://contoso.sharepoint.com/sites/team-a' } }));
    assert(loggerLogSpy.notCalled);
  });

  it('sets page title when specified', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/web/getfolderbyserverrelativeurl('/sites/team-a/sitepages')/files/AddTemplateFile`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          urlOfFile: '/sites/team-a/sitepages/page.aspx',
          templateFileType: 3
        })) {
        return {
          "CheckInComment": "",
          "CheckOutType": 2,
          "ContentTag": "{64201083-46BA-4966-8BC5-B0CB31E3456C},1,0",
          "CustomizedPageStatus": 1,
          "ETag": "\"{64201083-46BA-4966-8BC5-B0CB31E3456C},1\"",
          "Exists": true,
          "IrmEnabled": false,
          "Length": "780",
          "Level": 2,
          "LinkingUri": null,
          "LinkingUrl": "",
          "MajorVersion": 0,
          "MinorVersion": 1,
          "Name": "page.aspx",
          "ServerRelativeUrl": "/sites/team-a/SitePages/page.aspx",
          "TimeCreated": "2018-03-18T20:44:17Z",
          "TimeLastModified": "2018-03-18T20:44:17Z",
          "Title": null,
          "UIVersion": 1,
          "UIVersionLabel": "0.1",
          "UniqueId": "64201083-46ba-4966-8bc5-b0cb31e3456c"
        };
      }

      if ((opts.url as string).indexOf(`/_api/web/getfilebyid('64201083-46ba-4966-8bc5-b0cb31e3456c')/ListItemAllFields`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          ContentTypeId: '0x0101009D1CB255DA76424F860D91F20E6C4118',
          Title: 'My page',
          ClientSideApplicationId: 'b6917cb1-93a0-4b97-a84d-7cf49975d4ec',
          PageLayoutType: 'Article',
          PromotedState: 0,
          BannerImageUrl: {
            Description: '/_layouts/15/images/sitepagethumbnail.png',
            Url: `https://contoso.sharepoint.com/_layouts/15/images/sitepagethumbnail.png`
          }
        })) {
        return;
      }

      if ((opts.url as string).indexOf('_api/web/getfilebyid(\'64201083-46ba-4966-8bc5-b0cb31e3456c\')/ListItemAllFields/SetCommentsDisabled(true)') > -1) {
        return;
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { name: 'page.aspx', title: 'My page', webUrl: 'https://contoso.sharepoint.com/sites/team-a' } }));
    assert(loggerLogSpy.notCalled);
  });

  it('creates new modern page using the Home layout', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/sitepages/pages/GetByUrl('sitepages/page.aspx')/checkoutpage`) > -1) {
        return {
          Title: "page",
          Id: 1,
          BannerImageUrl: {
            Description: '/_layouts/15/images/sitepagethumbnail.png',
            Url: `https://contoso.sharepoint.com/_layouts/15/images/sitepagethumbnail.png`
          },
          CanvasContent1: "{}",
          layoutWebpartsContent: "{}"
        };
      }

      if ((opts.url as string).indexOf(`/_api/SitePages/Pages(1)/SavePage`) > -1) {
        return;
      }

      if ((opts.url as string).indexOf(`/_api/web/getfolderbyserverrelativeurl('/sites/team-a/sitepages')/files/AddTemplateFile`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          urlOfFile: '/sites/team-a/sitepages/page.aspx',
          templateFileType: 3
        })) {
        return {
          "CheckInComment": "",
          "CheckOutType": 2,
          "ContentTag": "{64201083-46BA-4966-8BC5-B0CB31E3456C},1,0",
          "CustomizedPageStatus": 1,
          "ETag": "\"{64201083-46BA-4966-8BC5-B0CB31E3456C},1\"",
          "Exists": true,
          "IrmEnabled": false,
          "Length": "780",
          "Level": 2,
          "LinkingUri": null,
          "LinkingUrl": "",
          "MajorVersion": 0,
          "MinorVersion": 1,
          "Name": "page.aspx",
          "ServerRelativeUrl": "/sites/team-a/SitePages/page.aspx",
          "TimeCreated": "2018-03-18T20:44:17Z",
          "TimeLastModified": "2018-03-18T20:44:17Z",
          "Title": null,
          "UIVersion": 1,
          "UIVersionLabel": "0.1",
          "UniqueId": "64201083-46ba-4966-8bc5-b0cb31e3456c"
        };
      }

      if ((opts.url as string).indexOf(`/_api/web/getfilebyid('64201083-46ba-4966-8bc5-b0cb31e3456c')/ListItemAllFields`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          ContentTypeId: '0x0101009D1CB255DA76424F860D91F20E6C4118',
          Title: 'page',
          ClientSideApplicationId: 'b6917cb1-93a0-4b97-a84d-7cf49975d4ec',
          PageLayoutType: 'Home'
        })) {
        return;
      }

      if ((opts.url as string).indexOf('_api/web/getfilebyid(\'64201083-46ba-4966-8bc5-b0cb31e3456c\')/ListItemAllFields/SetCommentsDisabled(true)') > -1) {
        return;
      }

      throw 'Invalid request';
    });

    sinon.stub(spo, 'setListItem').resolves();
    sinon.stub(spo, 'getFileAsListItemByUrl').resolves(fileResponse);

    await command.action(logger, { options: { debug: false, name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com/sites/team-a', layoutType: 'Home' } });
    assert(loggerLogSpy.notCalled);
  });

  it('creates new modern page and promotes it as NewsPage', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/sitepages/pages/GetByUrl('sitepages/page.aspx')/checkoutpage`) > -1) {
        return {
          Title: "page",
          Id: 1,
          BannerImageUrl: {
            Description: '/_layouts/15/images/sitepagethumbnail.png',
            Url: `https://contoso.sharepoint.com/_layouts/15/images/sitepagethumbnail.png`
          },
          CanvasContent1: "{}",
          layoutWebpartsContent: "{}"
        };
      }

      if ((opts.url as string).indexOf(`/_api/SitePages/Pages(1)/SavePage`) > -1) {
        return;
      }

      if ((opts.url as string).indexOf(`/_api/web/getfolderbyserverrelativeurl('/sites/team-a/sitepages')/files/AddTemplateFile`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          urlOfFile: '/sites/team-a/sitepages/page.aspx',
          templateFileType: 3
        })) {
        return {
          "CheckInComment": "",
          "CheckOutType": 2,
          "ContentTag": "{64201083-46BA-4966-8BC5-B0CB31E3456C},1,0",
          "CustomizedPageStatus": 1,
          "ETag": "\"{64201083-46BA-4966-8BC5-B0CB31E3456C},1\"",
          "Exists": true,
          "IrmEnabled": false,
          "Length": "780",
          "Level": 2,
          "LinkingUri": null,
          "LinkingUrl": "",
          "MajorVersion": 0,
          "MinorVersion": 1,
          "Name": "page.aspx",
          "ServerRelativeUrl": "/sites/team-a/SitePages/page.aspx",
          "TimeCreated": "2018-03-18T20:44:17Z",
          "TimeLastModified": "2018-03-18T20:44:17Z",
          "Title": null,
          "UIVersion": 1,
          "UIVersionLabel": "0.1",
          "UniqueId": "64201083-46ba-4966-8bc5-b0cb31e3456c"
        };
      }

      if ((opts.url as string).indexOf(`/_api/web/getfilebyid('64201083-46ba-4966-8bc5-b0cb31e3456c')/ListItemAllFields`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          ContentTypeId: '0x0101009D1CB255DA76424F860D91F20E6C4118',
          Title: 'page',
          ClientSideApplicationId: 'b6917cb1-93a0-4b97-a84d-7cf49975d4ec',
          PageLayoutType: 'Article',
          PromotedState: 0,
          BannerImageUrl: {
            Description: '/_layouts/15/images/sitepagethumbnail.png',
            Url: `https://contoso.sharepoint.com/_layouts/15/images/sitepagethumbnail.png`
          }
        })) {
        return;
      }

      if ((opts.url as string).indexOf('_api/web/getfilebyid(\'64201083-46ba-4966-8bc5-b0cb31e3456c\')/ListItemAllFields/SetCommentsDisabled(true)') > -1) {
        return;
      }

      if ((opts.url as string).indexOf(`/_api/web/getfilebyid('64201083-46ba-4966-8bc5-b0cb31e3456c')/ListItemAllFields`) > -1 &&
        opts.data.PromotedState === 2 &&
        opts.data.FirstPublishedDate) {
        return;
      }

      throw 'Invalid request';
    });

    sinon.stub(spo, 'setListItem').resolves();
    sinon.stub(spo, 'getFileAsListItemByUrl').resolves(fileResponse);

    await command.action(logger, { options: { debug: false, name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com/sites/team-a', promoteAs: 'NewsPage' } });
    assert(loggerLogSpy.notCalled);
  });

  it('creates new modern page and promotes it as Template', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/sitepages/pages/GetByUrl('sitepages/page.aspx')/checkoutpage`) > -1) {
        return {
          Title: "page",
          Id: 1,
          BannerImageUrl: {
            Description: '/_layouts/15/images/sitepagethumbnail.png',
            Url: `https://contoso.sharepoint.com/_layouts/15/images/sitepagethumbnail.png`
          },
          CanvasContent1: "{}",
          layoutWebpartsContent: "{}"
        };
      }

      if ((opts.url as string).indexOf(`/_api/SitePages/Pages(6)/SavePageAsTemplate`) > -1) {
        return { Id: 1, BannerImageUrl: 'url', CanvasContent1: 'content1', LayoutWebpartsContent: 'content', UniqueId: 'a4eb92e3-4eae-427f-8f6d-4e2ed907c2c4' };
      }

      if ((opts.url as string).indexOf(`/_api/SitePages/Pages(1)/SavePage`) > -1) {
        return;
      }

      if ((opts.url as string).indexOf(`/_api/web/getfolderbyserverrelativeurl('/sites/team-a/sitepages')/files/AddTemplateFile`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          urlOfFile: '/sites/team-a/sitepages/page.aspx',
          templateFileType: 3
        })) {
        return {
          "CheckInComment": "",
          "CheckOutType": 2,
          "ContentTag": "{64201083-46BA-4966-8BC5-B0CB31E3456C},1,0",
          "CustomizedPageStatus": 1,
          "ETag": "\"{64201083-46BA-4966-8BC5-B0CB31E3456C},1\"",
          "Exists": true,
          "IrmEnabled": false,
          "Length": "780",
          "Level": 2,
          "LinkingUri": null,
          "LinkingUrl": "",
          "MajorVersion": 0,
          "MinorVersion": 1,
          "Name": "page.aspx",
          "ServerRelativeUrl": "/sites/team-a/SitePages/page.aspx",
          "TimeCreated": "2018-03-18T20:44:17Z",
          "TimeLastModified": "2018-03-18T20:44:17Z",
          "Title": null,
          "UIVersion": 1,
          "UIVersionLabel": "0.1",
          "UniqueId": "64201083-46ba-4966-8bc5-b0cb31e3456c"
        };
      }

      if ((opts.url as string).indexOf(`/_api/web/getfilebyid('64201083-46ba-4966-8bc5-b0cb31e3456c')/ListItemAllFields`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          ContentTypeId: '0x0101009D1CB255DA76424F860D91F20E6C4118',
          Title: 'page',
          ClientSideApplicationId: 'b6917cb1-93a0-4b97-a84d-7cf49975d4ec',
          PageLayoutType: 'Article',
          PromotedState: 0,
          BannerImageUrl: {
            Description: '/_layouts/15/images/sitepagethumbnail.png',
            Url: `https://contoso.sharepoint.com/_layouts/15/images/sitepagethumbnail.png`
          }
        })) {
        return;
      }

      if ((opts.url as string).indexOf(`/_api/web/getfilebyid('64201083-46ba-4966-8bc5-b0cb31e3456c')/ListItemAllFields`) > -1 &&
        !opts.data) {
        return { Id: '1' };
      }

      if ((opts.url as string).indexOf(`/_api/web/getfilebyid('a4eb92e3-4eae-427f-8f6d-4e2ed907c2c4')/ListItemAllFields/SetCommentsDisabled`) > -1) {
        return;
      }

      if ((opts.url as string).indexOf(`/_api/SitePages/Pages(2)/SavePage`) > -1) {
        return;
      }

      throw 'Invalid request';
    });

    sinon.stub(spo, 'setListItem').resolves();
    sinon.stub(spo, 'getFileAsListItemByUrl').resolves(fileResponse);

    await command.action(logger, { options: { debug: false, name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com/sites/team-a', promoteAs: 'Template', layoutType: 'Article' } } as any);
    assert(loggerLogSpy.notCalled);
  });

  it('creates new modern page using the Home layout and promotes it as HomePage (debug)', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/sitepages/pages/GetByUrl('sitepages/page.aspx')/checkoutpage`) > -1) {
        return {
          Title: "page",
          Id: 1,
          BannerImageUrl: {
            Description: '/_layouts/15/images/sitepagethumbnail.png',
            Url: `https://contoso.sharepoint.com/_layouts/15/images/sitepagethumbnail.png`
          },
          CanvasContent1: "{}",
          layoutWebpartsContent: "{}"
        };
      }

      if ((opts.url as string).indexOf(`/_api/SitePages/Pages(1)/SavePage`) > -1) {
        return;
      }

      if ((opts.url as string).indexOf(`/_api/web/getfolderbyserverrelativeurl('/sites/team-a/sitepages')/files/AddTemplateFile`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          urlOfFile: '/sites/team-a/sitepages/page.aspx',
          templateFileType: 3
        })) {
        return {
          "CheckInComment": "",
          "CheckOutType": 2,
          "ContentTag": "{64201083-46BA-4966-8BC5-B0CB31E3456C},1,0",
          "CustomizedPageStatus": 1,
          "ETag": "\"{64201083-46BA-4966-8BC5-B0CB31E3456C},1\"",
          "Exists": true,
          "IrmEnabled": false,
          "Length": "780",
          "Level": 2,
          "LinkingUri": null,
          "LinkingUrl": "",
          "MajorVersion": 0,
          "MinorVersion": 1,
          "Name": "page.aspx",
          "ServerRelativeUrl": "/sites/team-a/SitePages/page.aspx",
          "TimeCreated": "2018-03-18T20:44:17Z",
          "TimeLastModified": "2018-03-18T20:44:17Z",
          "Title": null,
          "UIVersion": 1,
          "UIVersionLabel": "0.1",
          "UniqueId": "64201083-46ba-4966-8bc5-b0cb31e3456c"
        };
      }

      if ((opts.url as string).indexOf(`/_api/web/getfilebyid('64201083-46ba-4966-8bc5-b0cb31e3456c')/ListItemAllFields`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          ContentTypeId: '0x0101009D1CB255DA76424F860D91F20E6C4118',
          Title: 'page',
          ClientSideApplicationId: 'b6917cb1-93a0-4b97-a84d-7cf49975d4ec',
          PageLayoutType: 'Home'
        })) {
        return;
      }

      if ((opts.url as string).indexOf('_api/web/getfilebyid(\'64201083-46ba-4966-8bc5-b0cb31e3456c\')/ListItemAllFields/SetCommentsDisabled(true)') > -1) {
        return;
      }

      if ((opts.url as string).indexOf('_api/web/rootfolder') > -1 &&
        opts.data.WelcomePage === 'SitePages/page.aspx') {
        return;
      }

      throw 'Invalid request';
    });

    sinon.stub(spo, 'setListItem').resolves();
    sinon.stub(spo, 'getFileAsListItemByUrl').resolves(fileResponse);

    await command.action(logger, { options: { debug: true, name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com/sites/team-a', layoutType: 'Home', promoteAs: 'HomePage' } });
  });

  it('creates new modern page with comments enabled', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/web/getfolderbyserverrelativeurl('/sites/team-a/sitepages')/files/AddTemplateFile`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          urlOfFile: '/sites/team-a/sitepages/page.aspx',
          templateFileType: 3
        })) {
        return {
          "CheckInComment": "",
          "CheckOutType": 2,
          "ContentTag": "{64201083-46BA-4966-8BC5-B0CB31E3456C},1,0",
          "CustomizedPageStatus": 1,
          "ETag": "\"{64201083-46BA-4966-8BC5-B0CB31E3456C},1\"",
          "Exists": true,
          "IrmEnabled": false,
          "Length": "780",
          "Level": 2,
          "LinkingUri": null,
          "LinkingUrl": "",
          "MajorVersion": 0,
          "MinorVersion": 1,
          "Name": "page.aspx",
          "ServerRelativeUrl": "/sites/team-a/SitePages/page.aspx",
          "TimeCreated": "2018-03-18T20:44:17Z",
          "TimeLastModified": "2018-03-18T20:44:17Z",
          "Title": null,
          "UIVersion": 1,
          "UIVersionLabel": "0.1",
          "UniqueId": "64201083-46ba-4966-8bc5-b0cb31e3456c"
        };
      }

      if ((opts.url as string).indexOf(`/_api/web/getfilebyid('64201083-46ba-4966-8bc5-b0cb31e3456c')/ListItemAllFields`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          ContentTypeId: '0x0101009D1CB255DA76424F860D91F20E6C4118',
          Title: 'page',
          ClientSideApplicationId: 'b6917cb1-93a0-4b97-a84d-7cf49975d4ec',
          PageLayoutType: 'Article',
          PromotedState: 0,
          BannerImageUrl: {
            Description: '/_layouts/15/images/sitepagethumbnail.png',
            Url: `https://contoso.sharepoint.com/_layouts/15/images/sitepagethumbnail.png`
          }
        })) {
        return;
      }

      if ((opts.url as string).indexOf('_api/web/getfilebyid(\'64201083-46ba-4966-8bc5-b0cb31e3456c\')/ListItemAllFields/SetCommentsDisabled(false)') > -1) {
        return;
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com/sites/team-a', commentsEnabled: true } }));
    assert(loggerLogSpy.notCalled);
  });

  it('creates new modern page and check if saved as draft', async () => {
    let savedAsDraft = false;

    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/web/getfolderbyserverrelativeurl('/sites/team-a/sitepages')/files/AddTemplateFile`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          urlOfFile: '/sites/team-a/sitepages/page.aspx',
          templateFileType: 3
        })) {
        return {
          "CheckInComment": "",
          "CheckOutType": 2,
          "ContentTag": "{64201083-46BA-4966-8BC5-B0CB31E3456C},1,0",
          "CustomizedPageStatus": 1,
          "ETag": "\"{64201083-46BA-4966-8BC5-B0CB31E3456C},1\"",
          "Exists": true,
          "IrmEnabled": false,
          "Length": "780",
          "Level": 2,
          "LinkingUri": null,
          "LinkingUrl": "",
          "MajorVersion": 0,
          "MinorVersion": 1,
          "Name": "page.aspx",
          "ServerRelativeUrl": "/sites/team-a/SitePages/page.aspx",
          "TimeCreated": "2018-03-18T20:44:17Z",
          "TimeLastModified": "2018-03-18T20:44:17Z",
          "Title": null,
          "UIVersion": 1,
          "UIVersionLabel": "0.1",
          "UniqueId": "64201083-46ba-4966-8bc5-b0cb31e3456c"
        };
      }

      if ((opts.url as string).indexOf(`/_api/web/getfilebyid('64201083-46ba-4966-8bc5-b0cb31e3456c')/ListItemAllFields`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          ContentTypeId: '0x0101009D1CB255DA76424F860D91F20E6C4118',
          Title: 'page',
          ClientSideApplicationId: 'b6917cb1-93a0-4b97-a84d-7cf49975d4ec',
          PageLayoutType: 'Article',
          PromotedState: 0,
          BannerImageUrl: {
            Description: '/_layouts/15/images/sitepagethumbnail.png',
            Url: `https://contoso.sharepoint.com/_layouts/15/images/sitepagethumbnail.png`
          }
        })) {
        return;
      }

      if ((opts.url as string).indexOf('_api/web/getfilebyid(\'64201083-46ba-4966-8bc5-b0cb31e3456c\')/ListItemAllFields/SetCommentsDisabled(true)') > -1) {
        return;
      }

      if ((opts.url as string).indexOf(`/_api/sitepages/pages/GetByUrl('sitepages/page.aspx')/checkoutpage`) > -1) {
        return {
          Title: "page",
          Id: 1,
          BannerImageUrl: {
            Description: '/_layouts/15/images/sitepagethumbnail.png',
            Url: `https://contoso.sharepoint.com/_layouts/15/images/sitepagethumbnail.png`
          },
          CanvasContent1: "{}",
          layoutWebpartsContent: "{}"
        };
      }

      if ((opts.url as string).indexOf('_api/SitePages/Pages(1)/SavePageAsDraft') > -1) {
        savedAsDraft = true;
        return;
      }

      if ((opts.url as string).indexOf(`/_api/SitePages/Pages(1)/SavePage`) > -1) {
        return;
      }

      throw 'Invalid request';
    });

    sinon.stub(spo, 'setListItem').resolves();
    sinon.stub(spo, 'getFileAsListItemByUrl').resolves(fileResponse);

    await command.action(logger, { options: { debug: false, name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com/sites/team-a', publish: false } });
    assert.deepStrictEqual(savedAsDraft, true);
  });

  it('creates new modern page and publishes it', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/web/getfolderbyserverrelativeurl('/sites/team-a/sitepages')/files/AddTemplateFile`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          urlOfFile: '/sites/team-a/sitepages/page.aspx',
          templateFileType: 3
        })) {
        return {
          "CheckInComment": "",
          "CheckOutType": 2,
          "ContentTag": "{64201083-46BA-4966-8BC5-B0CB31E3456C},1,0",
          "CustomizedPageStatus": 1,
          "ETag": "\"{64201083-46BA-4966-8BC5-B0CB31E3456C},1\"",
          "Exists": true,
          "IrmEnabled": false,
          "Length": "780",
          "Level": 2,
          "LinkingUri": null,
          "LinkingUrl": "",
          "MajorVersion": 0,
          "MinorVersion": 1,
          "Name": "page.aspx",
          "ServerRelativeUrl": "/sites/team-a/SitePages/page.aspx",
          "TimeCreated": "2018-03-18T20:44:17Z",
          "TimeLastModified": "2018-03-18T20:44:17Z",
          "Title": null,
          "UIVersion": 1,
          "UIVersionLabel": "0.1",
          "UniqueId": "64201083-46ba-4966-8bc5-b0cb31e3456c"
        };
      }

      if ((opts.url as string).indexOf(`/_api/web/getfilebyid('64201083-46ba-4966-8bc5-b0cb31e3456c')/ListItemAllFields`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          ContentTypeId: '0x0101009D1CB255DA76424F860D91F20E6C4118',
          Title: 'page',
          ClientSideApplicationId: 'b6917cb1-93a0-4b97-a84d-7cf49975d4ec',
          PageLayoutType: 'Article',
          PromotedState: 0,
          BannerImageUrl: {
            Description: '/_layouts/15/images/sitepagethumbnail.png',
            Url: `https://contoso.sharepoint.com/_layouts/15/images/sitepagethumbnail.png`
          }
        })) {
        return;
      }

      if ((opts.url as string).indexOf('_api/web/getfilebyid(\'64201083-46ba-4966-8bc5-b0cb31e3456c\')/ListItemAllFields/SetCommentsDisabled(true)') > -1) {
        return;
      }

      if ((opts.url as string).indexOf(`/_api/sitepages/pages/GetByUrl('sitepages/page.aspx')/checkoutpage`) > -1) {
        return {
          Title: "page",
          Id: 1,
          BannerImageUrl: {
            Description: '/_layouts/15/images/sitepagethumbnail.png',
            Url: `https://contoso.sharepoint.com/_layouts/15/images/sitepagethumbnail.png`
          },
          CanvasContent1: "{}",
          layoutWebpartsContent: "{}"
        };
      }

      if ((opts.url as string).indexOf(`/_api/SitePages/Pages(1)/SavePage`) > -1) {
        return;
      }

      if ((opts.url as string).indexOf('_api/web/getfilebyid(\'64201083-46ba-4966-8bc5-b0cb31e3456c\')/CheckIn(comment=@a1,checkintype=@a2)?@a1=\'\'&@a2=1') > -1) {
        return;
      }

      throw 'Invalid request';
    });

    sinon.stub(spo, 'setListItem').resolves();
    sinon.stub(spo, 'getFileAsListItemByUrl').resolves(fileResponse);

    await command.action(logger, { options: { debug: false, name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com/sites/team-a', publish: true } });
    assert(loggerLogSpy.notCalled);
  });

  it('creates new modern page and publishes it with a message (debug)', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/sitepages/pages/GetByUrl('sitepages/page.aspx')/checkoutpage`) > -1) {
        return {
          Title: "page",
          Id: 1,
          BannerImageUrl: {
            Description: '/_layouts/15/images/sitepagethumbnail.png',
            Url: `https://contoso.sharepoint.com/_layouts/15/images/sitepagethumbnail.png`
          },
          CanvasContent1: "{}",
          layoutWebpartsContent: "{}"
        };
      }

      if ((opts.url as string).indexOf(`/_api/SitePages/Pages(1)/SavePage`) > -1) {
        return;
      }

      if ((opts.url as string).indexOf(`/_api/web/getfilebyid('64201083-46ba-4966-8bc5-b0cb31e3456c')/CheckIn(comment=@a1,checkintype=@a2)?@a1='Initial%20version'&@a2=1`) > -1) {
        return;
      }

      if ((opts.url as string).indexOf(`/_api/web/getfolderbyserverrelativeurl('/sites/team-a/sitepages')/files/AddTemplateFile`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          urlOfFile: '/sites/team-a/sitepages/page.aspx',
          templateFileType: 3
        })) {
        return {
          "CheckInComment": "",
          "CheckOutType": 2,
          "ContentTag": "{64201083-46BA-4966-8BC5-B0CB31E3456C},1,0",
          "CustomizedPageStatus": 1,
          "ETag": "\"{64201083-46BA-4966-8BC5-B0CB31E3456C},1\"",
          "Exists": true,
          "IrmEnabled": false,
          "Length": "780",
          "Level": 2,
          "LinkingUri": null,
          "LinkingUrl": "",
          "MajorVersion": 0,
          "MinorVersion": 1,
          "Name": "page.aspx",
          "ServerRelativeUrl": "/sites/team-a/SitePages/page.aspx",
          "TimeCreated": "2018-03-18T20:44:17Z",
          "TimeLastModified": "2018-03-18T20:44:17Z",
          "Title": null,
          "UIVersion": 1,
          "UIVersionLabel": "0.1",
          "UniqueId": "64201083-46ba-4966-8bc5-b0cb31e3456c"
        };
      }

      if ((opts.url as string).indexOf(`/_api/web/getfilebyid('64201083-46ba-4966-8bc5-b0cb31e3456c')/ListItemAllFields`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          ContentTypeId: '0x0101009D1CB255DA76424F860D91F20E6C4118',
          Title: 'page',
          ClientSideApplicationId: 'b6917cb1-93a0-4b97-a84d-7cf49975d4ec',
          PageLayoutType: 'Article',
          PromotedState: 0,
          BannerImageUrl: {
            Description: '/_layouts/15/images/sitepagethumbnail.png',
            Url: `https://contoso.sharepoint.com/_layouts/15/images/sitepagethumbnail.png`
          }
        })) {
        return;
      }

      if ((opts.url as string).indexOf('_api/web/getfilebyid(\'64201083-46ba-4966-8bc5-b0cb31e3456c\')/ListItemAllFields/SetCommentsDisabled(true)') > -1) {
        return;
      }

      throw 'Invalid request';
    });

    sinon.stub(spo, 'setListItem').resolves();
    sinon.stub(spo, 'getFileAsListItemByUrl').resolves(fileResponse);

    await command.action(logger, { options: { debug: true, name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com/sites/team-a', publish: true, publishMessage: 'Initial version' } });
  });

  it('escapes special characters in user input', async () => {
    sinon.stub(request, 'post').callsFake(async (opts) => {
      if ((opts.url as string).indexOf(`/_api/web/getfolderbyserverrelativeurl('/sites/team-a/sitepages')/files/AddTemplateFile`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          urlOfFile: '/sites/team-a/sitepages/page.aspx',
          templateFileType: 3
        })) {
        return {
          "CheckInComment": "",
          "CheckOutType": 2,
          "ContentTag": "{64201083-46BA-4966-8BC5-B0CB31E3456C},1,0",
          "CustomizedPageStatus": 1,
          "ETag": "\"{64201083-46BA-4966-8BC5-B0CB31E3456C},1\"",
          "Exists": true,
          "IrmEnabled": false,
          "Length": "780",
          "Level": 2,
          "LinkingUri": null,
          "LinkingUrl": "",
          "MajorVersion": 0,
          "MinorVersion": 1,
          "Name": "page.aspx",
          "ServerRelativeUrl": "/sites/team-a/SitePages/page.aspx",
          "TimeCreated": "2018-03-18T20:44:17Z",
          "TimeLastModified": "2018-03-18T20:44:17Z",
          "Title": null,
          "UIVersion": 1,
          "UIVersionLabel": "0.1",
          "UniqueId": "64201083-46ba-4966-8bc5-b0cb31e3456c"
        };
      }

      if ((opts.url as string).indexOf(`/_api/web/getfilebyid('64201083-46ba-4966-8bc5-b0cb31e3456c')/ListItemAllFields`) > -1 &&
        JSON.stringify(opts.data) === JSON.stringify({
          ContentTypeId: '0x0101009D1CB255DA76424F860D91F20E6C4118',
          Title: 'page',
          ClientSideApplicationId: 'b6917cb1-93a0-4b97-a84d-7cf49975d4ec',
          PageLayoutType: 'Article',
          PromotedState: 0,
          BannerImageUrl: {
            Description: '/_layouts/15/images/sitepagethumbnail.png',
            Url: `https://contoso.sharepoint.com/_layouts/15/images/sitepagethumbnail.png`
          }
        })) {
        return;
      }

      if ((opts.url as string).indexOf('_api/web/getfilebyid(\'64201083-46ba-4966-8bc5-b0cb31e3456c\')/ListItemAllFields/SetCommentsDisabled(true)') > -1) {
        return;
      }

      if ((opts.url as string).indexOf('_api/web/getfilebyid(\'64201083-46ba-4966-8bc5-b0cb31e3456c\')/Publish(\'Don%39t%20tell\')') > -1) {
        return;
      }

      throw 'Invalid request';
    });

    await assert.rejects(command.action(logger, { options: { name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com/sites/team-a', publish: true, publishMessage: 'Don\'t tell' } }));
    assert(loggerLogSpy.notCalled);
  });

  it('correctly handles OData error when creating modern page', async () => {
    sinon.stub(request, 'post').callsFake(async () => {
      throw { error: { 'odata.error': { message: { value: 'An error has occurred' } } } };
    });

    await assert.rejects(command.action(logger, { options: { debug: false, name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com/sites/team-a' } } as any),
      new CommandError('An error has occurred'));
  });

  it('supports specifying name', () => {
    const options = command.options;
    let containsOption = false;
    options.forEach(o => {
      if (o.option.indexOf('--name') > -1) {
        containsOption = true;
      }
    });
    assert(containsOption);
  });

  it('supports specifying webUrl', () => {
    const options = command.options;
    let containsOption = false;
    options.forEach(o => {
      if (o.option.indexOf('--webUrl') > -1) {
        containsOption = true;
      }
    });
    assert(containsOption);
  });

  it('supports specifying page layout', () => {
    const options = command.options;
    let containsOption = false;
    options.forEach(o => {
      if (o.option.indexOf('--layoutType') > -1) {
        containsOption = true;
      }
    });
    assert(containsOption);
  });

  it('supports specifying page promote option', () => {
    const options = command.options;
    let containsOption = false;
    options.forEach(o => {
      if (o.option.indexOf('--promoteAs') > -1) {
        containsOption = true;
      }
    });
    assert(containsOption);
  });

  it('supports specifying if comments should be enabled', () => {
    const options = command.options;
    let containsOption = false;
    options.forEach(o => {
      if (o.option.indexOf('--commentsEnabled') > -1) {
        containsOption = true;
      }
    });
    assert(containsOption);
  });

  it('supports specifying if page should be published', () => {
    const options = command.options;
    let containsOption = false;
    options.forEach(o => {
      if (o.option.indexOf('--publish') > -1) {
        containsOption = true;
      }
    });
    assert(containsOption);
  });

  it('supports specifying page publish message', () => {
    const options = command.options;
    let containsOption = false;
    options.forEach(o => {
      if (o.option.indexOf('--publishMessage') > -1) {
        containsOption = true;
      }
    });
    assert(containsOption);
  });

  it('fails validation if webUrl is not an absolute URL', async () => {
    const actual = await command.validate({ options: { name: 'page.aspx', webUrl: 'foo' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if webUrl is not a valid SharePoint URL', async () => {
    const actual = await command.validate({ options: { name: 'page.aspx', webUrl: 'http://foo' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation when name and webURL specified and webUrl is a valid SharePoint URL', async () => {
    const actual = await command.validate({ options: { name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation when name has no extension', async () => {
    const actual = await command.validate({ options: { name: 'page', webUrl: 'https://contoso.sharepoint.com' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('fails validation if layout type is invalid', async () => {
    const actual = await command.validate({ options: { name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com', layoutType: 'invalid' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if layout type is Home', async () => {
    const actual = await command.validate({ options: { name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com', layoutType: 'Home' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation if layout type is Article', async () => {
    const actual = await command.validate({ options: { name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com', layoutType: 'Article' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation if layout type is SingleWebPartAppPage', async () => {
    const actual = await command.validate({ options: { name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com', layoutType: 'SingleWebPartAppPage' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation if layout type is RepostPage', async () => {
    const actual = await command.validate({ options: { name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com', layoutType: 'RepostPage' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation if layout type is HeaderlessSearchResults', async () => {
    const actual = await command.validate({ options: { name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com', layoutType: 'HeaderlessSearchResults' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation if layout type is Spaces', async () => {
    const actual = await command.validate({ options: { name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com', layoutType: 'Spaces' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation if layout type is Topic', async () => {
    const actual = await command.validate({ options: { name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com', layoutType: 'Topic' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('fails validation if promote type is invalid', async () => {
    const actual = await command.validate({ options: { name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com', promoteAs: 'invalid' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('passes validation if promote type is HomePage', async () => {
    const actual = await command.validate({ options: { name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com', promoteAs: 'HomePage', layoutType: 'Home' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation if promote type is NewsPage', async () => {
    const actual = await command.validate({ options: { name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com', promoteAs: 'NewsPage' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('passes validation if promote type is Template', async () => {
    const actual = await command.validate({ options: { name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com', promoteAs: 'Template' } }, commandInfo);
    assert.strictEqual(actual, true);
  });

  it('fails validation if promote type is HomePage but layout type is not Home', async () => {
    const actual = await command.validate({ options: { name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com', promoteAs: 'HomePage', layoutType: 'Article' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });

  it('fails validation if promote type is NewsPage but layout type is not Article', async () => {
    const actual = await command.validate({ options: { name: 'page.aspx', webUrl: 'https://contoso.sharepoint.com', promoteAs: 'NewsPage', layoutType: 'Home' } }, commandInfo);
    assert.notStrictEqual(actual, true);
  });
});
