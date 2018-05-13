import { observable, action, computed } from 'mobx';
import * as Interfaces from '../api_interfaces';
import ApiClient from '../client';
import { message } from 'antd';

const store = require('store');

const TOKEN_KEY = 'token';

const compare = (a: { created_at: string }, b: { created_at: string }) =>
  Date.parse(b.created_at) - Date.parse(a.created_at);
export default class SessionState {
  @observable public messages: Interfaces.Message[] = [];
  @observable public subscriptions: Interfaces.Subscription[] = [];
  @observable public services: Interfaces.Service[] = [];
  @observable public session?: Interfaces.Session;
  @computed public get authenticated() {
    if (!this.session) { return false; }
    if (Date.parse(this.session.expires_at) < Date.now()) { return false; }
    return true;
  }

  public client?: ApiClient;

  constructor() {
    const savedToken = store.get(TOKEN_KEY);
    if (savedToken) { this.setToken(savedToken); }
  }

  @action setToken(session: Interfaces.Session) {
    this.client = new ApiClient(session.token);
    store.set(TOKEN_KEY, session);
    this.session = session;
  }
  @action removeToken() {
    store.remove(TOKEN_KEY);
    this.messages = [];
    this.subscriptions = [];
    this.services = [];
    this.session = undefined;
  }
  @action login = async (email: string, password: string) => {
    const session = await ApiClient.login(email, password);
    this.setToken(session);
    return session.token;
  }

  @action retrieveMessages = async (forced = false) => {
    if (!this.authenticated) { return; }
    if (!forced && this.messages.length > 0) { return; }
    try {
      this.messages = (await this.client!.getMessages()).sort(compare);
    } catch (ex) {
      message.error('加载消息失败 - '.concat(ex.message));
    }
  }
  @action retrieveSubscriptions = async (forced = false) => {
    if (!this.authenticated) { return; }
    if (!forced && this.subscriptions.length > 0) { return; }
    try {
      this.subscriptions = (await this.client!.getSubscriptions()).sort(compare);
    } catch (ex) {
      message.error('加载订阅列表失败 - '.concat(ex.message));
    }
  }
  @action retrieveServices = async (forced = false) => {
    if (!this.authenticated) { return; }
    if (!forced && this.services.length > 0) { return; }
    try {
      this.services = await this.client!.getServices();
    } catch (ex) {
      message.error('加载服务列表失败 - '.concat(ex.message));
    }
  }
  @action markAsReaded = async (id: string) => {
    if (!this.authenticated) { return; }
    try {
      await this.client!.markAsReaded(id);
      this.messages.splice(this.messages.findIndex(value => value.id === id), 1);
    } catch (ex) {
      message.error('标记已读失败' + ex.message);
    }
  }
  @action loadSession = async () => {
    if (this.authenticated && !this.session) {
      this.session = await this.client!.getSession();
    }
  }
  @action retrieveLatestData = async () => {
    await this.retrieveServices(true);
    await this.retrieveSubscriptions(true);
    await this.retrieveMessages(true);
  }
  @action retrieveLatestServices = async () => {
    await this.retrieveServices(true);
  }
  @action updateSubscriptionConfig = async (id: string, config: string) => {
    if (!this.authenticated) { return; }
    try {
      this.subscriptions[
        this.subscriptions.findIndex(value => value.id === id)
      ].config = (await this.client!.updateSubscription(id, config)).config;
    } catch (ex) {
      message.error('更新配置失败 ' + ex.message);
    }
  }
  @action deleteSubscription = async (id: string) => {
    if (!this.authenticated) { return; }
    try {
      await this.client!.deleteSubscription(id);
      this.subscriptions[
        this.subscriptions.findIndex(value => value.id === id)
      ].deleted = true;
    } catch (ex) {
      message.error('删除失败' + ex.message);
    }
  }
}