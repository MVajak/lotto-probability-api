import {expect} from '@loopback/testlab';

import {getEstonianLottoHeaders} from '../getEstonianLottoHeaders';

describe('getEstonianLottoHeaders', () => {
  it('should return all required headers', () => {
    const headers = getEstonianLottoHeaders();

    expect(headers).to.eql({
      accept: '*/*',
      'accept-language': 'et-EE,et;q=0.9,en-US;q=0.8,en;q=0.7',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      origin: 'https://www.eestiloto.ee',
      priority: 'u=1, i',
      referer: 'https://www.eestiloto.ee/et/results/',
      'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      'x-requested-with': 'XMLHttpRequest',
    });
  });
});
