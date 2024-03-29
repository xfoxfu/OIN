import axios, { AxiosBasicCredentials } from 'axios';
import * as Interfaces from './api_interfaces';

class ApiClient {
  public static register = async (
    email: string,
    password: string,
    nickname?: string,
  ) => {
    return await ApiClient.post<
      Interfaces.User,
      {
        email: string;
        password: string;
        nickname?: string;
      }
    >('/users', { email, password, nickname });
  }
  public static login = async (email: string, password: string) => {
    return await ApiClient.post<Interfaces.Session, {}>(
      '/sessions',
      {},
      { username: email, password: password },
    );
  }

  private static constructApiUrl = (url: string) =>
    (process.env.REACT_APP_API_ROOT || 'http://127.0.0.1:3000/rest').concat(
      url,
    )
  private static constructOptions = (auth?: AxiosBasicCredentials | string) =>
    typeof auth === 'undefined'
      ? undefined
      : typeof auth === 'string'
        ? {
            headers: {
              Authorization: 'Bearer '.concat(auth),
            },
          }
        : { auth }
  private static get = async <T>(
    url: string,
    // tslint:disable-next-line:no-any
    query?: any,
    auth?: AxiosBasicCredentials | string,
  ): Promise<T> => {
    const result = await axios.get(ApiClient.constructApiUrl(url), {
      ...ApiClient.constructOptions(auth),
      params: query,
    });
    return result.data;
  }
  private static getWithPagination = async <T>(
    url: string,
    auth?: AxiosBasicCredentials | string,
    until?: string,
    limit?: number,
  ): Promise<T[]> => {
    const result = await axios.get(ApiClient.constructApiUrl(url), {
      ...ApiClient.constructOptions(auth),
      params: { until, limit },
    });
    return result.data;
  }
  private static post = async <TRes, TReq>(
    url: string,
    data: TReq,
    auth?: AxiosBasicCredentials | string,
  ): Promise<TRes> => {
    const result = await axios.post(
      ApiClient.constructApiUrl(url),
      data,
      ApiClient.constructOptions(auth),
    );
    return result.data;
  }
  private static put = async <TRes, TReq>(
    url: string,
    data: TReq,
    auth?: AxiosBasicCredentials | string,
  ): Promise<TRes> => {
    const result = await axios.put(
      ApiClient.constructApiUrl(url),
      data,
      ApiClient.constructOptions(auth),
    );
    return result.data;
  }
  private static delete = async <T>(
    url: string,
    auth?: AxiosBasicCredentials | string,
  ): Promise<T> => {
    const result = await axios.delete(
      ApiClient.constructApiUrl(url),
      ApiClient.constructOptions(auth),
    );
    return result.data;
  }

  constructor(private token: string) {}
  // tslint:disable-next-line:no-any
  public get = async <T>(url: string, query?: any): Promise<T> =>
    ApiClient.get<T>(url, query, this.token)
  public getWithPagination = async <T>(
    url: string,
    until?: string,
    limit?: number,
  ) => ApiClient.getWithPagination<T>(url, this.token, until, limit)
  public post = async <TRes, TReq>(url: string, data: TReq): Promise<TRes> =>
    ApiClient.post<TRes, TReq>(url, data, this.token)
  public put = async <TRes, TReq>(url: string, data: TReq): Promise<TRes> =>
    ApiClient.put<TRes, TReq>(url, data, this.token)
  public delete = async <T>(url: string): Promise<T> =>
    ApiClient.delete<T>(url, this.token)

  public getMessage = (id: string) =>
    this.get<Interfaces.Message>('/messages/'.concat(id))
  public getMessages = () => this.get<Interfaces.Message[]>('/messages/mine');
  public getMessagesWithQuery = (
    query = 'readed:false',
    until?: string,
    limit = 25,
  ) =>
    this.getWithPagination<Interfaces.Message>(
      ['/messages/mine', `query=${encodeURIComponent(query)}`].join('?'),
      until,
      limit,
    )
  public getServices = () => this.get<Interfaces.Service[]>('/services');
  public getService = (id: string) =>
    this.get<Interfaces.Service>('/services/'.concat(id))
  public getSubscriptions = (query = 'enabled:true') =>
    this.get<Interfaces.Subscription[]>('/subscriptions/mine', { query })
  public getSubscription = (id: string) =>
    this.get<Interfaces.Subscription>('/subscriptions/'.concat(id))
  public getSession = () => this.get<Interfaces.Session>('/session');

  public markAsReaded = (id: string) =>
    this.post<{ readed: boolean }, { readed: true }>('/messages/'.concat(id), {
      readed: true,
    })
  public createSubscription = (service: string, config: string, name: string) =>
    this.post<
      Interfaces.Subscription,
      {
        service: string;
        config: string;
        name: string;
      }
    >('/subscriptions', { service, config, name })
  public updateSubscription = (
    subscription: string,
    updateQuery: {
      config?: string;
      name?: string;
    },
  ) =>
    this.post<
      Interfaces.Subscription,
      {
        config?: string;
        name?: string;
      }
    >('/subscriptions/'.concat(subscription), updateQuery)
  public deleteSubscription = (id: string) =>
    this.delete<Interfaces.Subscription>('/subscriptions/'.concat(id))
}

export default ApiClient;
