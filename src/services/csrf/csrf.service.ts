import {BindingScope, inject, injectable} from '@loopback/core';
import axios, {AxiosInstance, AxiosResponse} from 'axios';
import {wrapper} from 'axios-cookiejar-support';
import * as cheerio from 'cheerio';
import {Cookie, CookieJar} from 'tough-cookie';

import {
  ESTONIAN_LOTTO_RESULT_URL,
  EstonianLottoApiClient,
} from '../../clients/EstonianLottoApiClient';
import {safeBig} from '../../common/utils/calculations';

import {CachedToken} from './types';

const SESSION_VALID_TIME = 1800; // in seconds

@injectable({scope: BindingScope.SINGLETON})
export class CsrfService {
  private readonly jar: CookieJar;
  private readonly client;

  private cache: CachedToken | null = null;

  constructor(
    @inject('clients.EstonianLottoApiClient')
    private readonly estonianLottoApiClient: EstonianLottoApiClient,
  ) {
    this.jar = new CookieJar();
    this.client = wrapper(axios.create({jar: this.jar, withCredentials: true}));
  }

  async getCsrfToken(): Promise<string> {
    if (this.isTokenValid()) {
      // @ts-expect-error -- validated inside isTokenValid() function
      return this.cache.token;
    }

    const response: AxiosResponse = await this.fetchSessionData();

    await this.setSessionCookies(response.headers);
    const csrfToken = this.extractCsrfToken(response.data);

    await this.setSessionCache(csrfToken);

    return csrfToken;
  }

  getClient(): AxiosInstance {
    return this.client;
  }

  getCache(): CachedToken | null {
    return this.cache;
  }

  private async fetchSessionData(): Promise<AxiosResponse> {
    return this.estonianLottoApiClient.getEstonianLottoResult();
  }

  private extractCsrfToken(data: AxiosResponse['data']): string {
    const $ = cheerio.load(data);
    const csrfToken = $('input[name="csrfToken"]').val();

    if (!csrfToken || typeof csrfToken !== 'string') {
      throw new Error(`Invalid CSRF token: ${csrfToken}`);
    }

    return csrfToken;
  }

  private async setSessionCache(csrfToken: string): Promise<void> {
    const sessionCookie = await this.getSessionCookie(ESTONIAN_LOTTO_RESULT_URL);
    const sessionId = sessionCookie?.value ?? '';
    const maxAge = sessionCookie?.maxAge ?? SESSION_VALID_TIME;

    this.cache = {
      token: csrfToken,
      fetchedAt: Date.now(),
      sessionId,
      maxAge: safeBig(maxAge).toNumber(),
    };
  }

  private async setSessionCookies(responseHeaders: AxiosResponse['headers']): Promise<void> {
    for (const cookieString of responseHeaders['set-cookie'] ?? []) {
      await this.jar.setCookie(cookieString, ESTONIAN_LOTTO_RESULT_URL);
    }
  }

  private async getSessionCookie(url: string): Promise<Cookie | undefined> {
    const cookies = await this.jar.getCookies(url);
    console.log(cookies);
    return cookies.find(c => c.key === '__Host-MYSESSIONCOOKIE');
  }

  private isTokenValid(): boolean {
    if (!this.cache) {
      return false;
    }

    const {fetchedAt, maxAge} = this.cache;
    const now = Date.now();

    return now - fetchedAt < maxAge * 1000;
  }
}
