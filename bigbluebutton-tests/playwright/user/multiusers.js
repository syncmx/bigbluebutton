const { expect } = require('@playwright/test');
const Page = require('../core/page');
const e = require('../core/elements');
const { ELEMENT_WAIT_TIME, ELEMENT_WAIT_LONGER_TIME } = require('../core/constants');
const { connectionStatus, checkNetworkStatus } = require('./util');
const { checkElementLengthEqualTo } = require('../core/util');
const { waitAndClearNotification } = require('../notifications/util');

class MultiUsers {
  constructor(browser, context) {
    this.browser = browser;
    this.context = context;
  }

  async initPages(page1) {
    await this.initModPage(page1);
    await this.initUserPage();
  }

  async initModPage(page, shouldCloseAudioModal = true, { fullName = 'Moderator', ...restOptions } = {}) {
    const options = {
      fullName,
      ...restOptions,
    };

    this.modPage = new Page(this.browser, page);
    await this.modPage.init(true, shouldCloseAudioModal, options);
  }

  async initUserPage(shouldCloseAudioModal = true, context = this.context, { fullName = 'Attendee', useModMeetingId = true, ...restOptions } = {}) {
    const options = {
      ...restOptions,
      fullName,
      meetingId: (useModMeetingId) ? this.modPage.meetingId : undefined,
    };

    const page = await context.newPage();
    this.userPage = new Page(this.browser, page);
    await this.userPage.init(false, shouldCloseAudioModal, options);
  }

  async userPresence() {
    const firstUserOnModPage = this.modPage.getLocator(e.firstUser);
    const secondUserOnModPage = this.modPage.getLocator(e.userListItem);
    const firstUserOnUserPage = this.userPage.getLocator(e.firstUser);
    const secondUserOnUserPage = this.userPage.getLocator(e.userListItem);
    await expect(firstUserOnModPage).toHaveCount(1);
    await expect(secondUserOnModPage).toHaveCount(1);
    await expect(firstUserOnUserPage).toHaveCount(1);
    await expect(secondUserOnUserPage).toHaveCount(1);
  }

  async disableWebcamsFromConnectionStatus() {
    await this.modPage.shareWebcam(true, ELEMENT_WAIT_LONGER_TIME);
    await this.userPage.shareWebcam(true, ELEMENT_WAIT_LONGER_TIME);
    await connectionStatus(this.modPage);
    await this.modPage.waitAndClickElement(e.dataSavingWebcams);
    await this.modPage.waitAndClickElement(e.closeConnectionStatusModal);
    await waitAndClearNotification(this.modPage);
    const checkUserWhoHasDisabled = await this.modPage.page.evaluate(checkElementLengthEqualTo, [e.videoContainer, 1]);
    const checkSecondUser = await this.userPage.page.evaluate(checkElementLengthEqualTo, [e.videoContainer, 2]);
    await expect(checkUserWhoHasDisabled).toBeTruthy();
    await expect(checkSecondUser).toBeTruthy();
  }

  async usersConnectionStatus() {
    await this.modPage.shareWebcam(true);
    await this.initUserPage();
    await this.userPage.waitAndClick(e.joinAudio);
    await this.userPage.joinMicrophone();
    await this.userPage.shareWebcam(true);
    await this.userPage.waitAndClick(e.connectionStatusBtn);

    await this.userPage.page.waitForFunction(checkNetworkStatus,
      { dataContainer: e.connectionDataContainer, networdData: e.connectionNetwordData },
      { timeout: ELEMENT_WAIT_TIME },
    );
  }

  async raiseHandTest() {
    await this.userPage.waitAndClick(e.raiseHandBtn);
    await this.userPage.hasElement(e.lowerHandBtn);
  }

  async getAvatarColorAndCompareWithUserListItem() {
    const getBackgroundColorComputed = (locator) => locator.evaluate((elem) => getComputedStyle(elem).backgroundColor);

    const avatarInToastElementColor = this.modPage.getLocator(e.avatarsWrapperAvatar);
    const avatarInUserListColor = this.modPage.getLocator(`${e.userListItem} > div ${e.userAvatar}`);
    await expect(getBackgroundColorComputed(avatarInToastElementColor)).toStrictEqual(getBackgroundColorComputed(avatarInUserListColor));
  }

  async lowerHandTest() {
    await waitAndClearNotification(this.userPage);
    await this.userPage.waitAndClick(e.lowerHandBtn);
    await this.userPage.hasElement(e.raiseHandBtn);
  }

  async whiteboardAccess() {
    await this.modPage.waitForSelector(e.whiteboard);
    await this.modPage.waitAndClick(e.userListItem);
    await this.modPage.waitAndClick(e.changeWhiteboardAccess);
    await this.modPage.waitForSelector(e.multiWhiteboardTool);
    const resp = await this.modPage.page.evaluate((multiWhiteboardTool) => {
      return document.querySelector(multiWhiteboardTool).children[0].innerText === '1';
    }, e.multiWhiteboardTool);
    await expect(resp).toBeTruthy();
  }
}

exports.MultiUsers = MultiUsers;
