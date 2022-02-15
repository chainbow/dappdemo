
export interface ITransactionInput {
  prevTxId: string;
  outputIndex: number;
  satoshis: number;
  lockingScript?: string;
  unlockingScript?: string;
  sequenceNumber? : number;
}
export interface ITransactionOutput {
  to: string; //bitcoin address or paymail address or script
  format?: 'address' | 'paymail' | 'script';
  amount: string;
}

export interface ITransaction {
  description?: string; // desc the payment
  inputs?: ITransactionInput[];
  outputs: ITransactionOutput[];
  nLockTime?: number;
  contract?: string; //when sending satoshi, set it empty string or undefined
}

export interface IAssetData {
  symbol: string;
  name: string;
  balance: string;
  decimals: string;
  contract?: string;
}

export interface IAccountBalances {
  [key: string]: IAssetData;
}

export interface IAccount {
  username: string;
  alias: string;
  domain: string;
  address: string;
  balances?: IAccountBalances;
}

export interface IMessageParameters {
  address: string;
  message: string;
}


export interface IMessageResult {
  signature?: string;
  error?: string;
}

export interface ISendTransactionResult {
  txId?: string;
  error?: string;
}

export interface ITransactionSig {
  reqestIndex: number;
  prevTxId: string;
  outputIndex: number;
  satoshis: number;
  scriptHex: string;
  sequenceNumber?: number;
  inputIndex: number;
  requestIndex: number;
  signature: string;
  pubkey: string;
  sigtype: number;
}
export interface ISignTransactionResult {
  signatures: ITransactionSig[];
  error?: string;
}
export interface ISignRequest {
  inputIndex: number;
  address?: string; //address string or hash hex
  pubkey?: string; //default is undefined.
  index?: number; //default is undefined. address index
  target?: number; //default is undefined. address target, 0: receive, 1:change
  sigtype?: number; //default is undefined.
  flags?: number; //default is undefined
}
export interface ISignTransaction {
  transaction: ITransaction;
  signRequests: ISignRequest[];
}


export const DEFAULT_RELAY_PROVIDER = 'wss://wc.cercle.sg';
export const CHAIN_ID = 'bsv:livenet';
// export const CHAIN_ID = 'bsv:testnet';

export const DEFAULT_LOGGER = 'debug';

export const APPROVAL_METHODS = {
  sendTransaction: 'sendTransaction',
  signTransaction: 'signTransaction',
  sendRawTransaction: 'sendRawTransaction',
  signMessage: 'signMessage',
};

export const NON_APPROVAL_METHODS = {
  getBalance: 'getBalance',
  getNewAddress: 'getNewAddress',
  verifyAddress: 'verifyAddress',
};
