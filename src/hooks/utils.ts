
export const checkAddressFormat = (val: string) => {
  const bitcoin = /^[1mn][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const email =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return bitcoin.test(val) || email.test(val);
};

export const DAPP: any = {
  name: 'Example Dapp',
  description: 'Example Dapp',
  url: 'https://testwc.mydapp.io',
  icons: ['https://chainbow.io/logo.svg'],
};

export function inIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}
