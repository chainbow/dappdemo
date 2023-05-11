/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-var-requires */
global.Buffer = global.Buffer || require('buffer').Buffer;
global.process = global.process || require('process');

import SignClient from '@walletconnect/sign-client';
import { SessionTypes } from '@walletconnect/types';
import { getSdkError } from '@walletconnect/utils';
import { Web3Modal } from '@web3modal/standalone';
import SessionStorageWC from 'src/utils/SessionStorageWC';
import { onMounted, reactive, toRefs } from 'vue';
import { useRoute } from 'vue-router';
import {
  IAccountBalances,
  IAssetData,
  IMessageParameters,
  IMessageResult,
  ISignTransaction,
  ISignTransactionResult,
  ITransaction,
} from './useWalletTypes';

const Message = require('bsv/message');

export const BSV_CHAINS = [ 'bsv:livenet', 'bsv:testnet'];
export const RXD_CHAINS = [ 'rxd:livenet', 'rxd:testnet'];

//
export const DEVELOPMENT_CHAINS = [ 'bsv:testnet', 'rxd:testnet'];


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


const ChainBowWallet = {
  id: 'chainbow',
  name: 'ChainBow Wallet',
  links: {
      universal: 'https://chainbow.io/',
      native: 'chainbow://'
  }
}
/**
 * Web3Modal Config
 */
const web3Modal = new Web3Modal({
  walletConnectVersion: 2,
  projectId: 'dcc082395a803b97ed77800c84613382',
  themeMode: 'light',
  desktopWallets: [ChainBowWallet],
  mobileWallets:[ChainBowWallet],
  standaloneChains: [
    'bsv:livenet', 'bsv:testnet',
    'rxd:livenet', 'rxd:testnet'
  ]
});

const allowMethods: string[] = Object.values(APPROVAL_METHODS).concat(
  Object.values(NON_APPROVAL_METHODS)
);

interface IAppState {
  isInitializing: boolean;
  wallet: string | undefined;
  client?: SignClient;
  session?: any;
  chains: any[];
  accounts: { username: string, alias: string, domain: string, address: string }[];
  pairings: any[];
  balances: any[];
  currentChainId: string;
}

const INITIAL_STATE: IAppState = {
  isInitializing: false,
  currentChainId: BSV_CHAINS[0],
  wallet: undefined,
  client: undefined,
  chains: [],
  accounts: [],
  pairings: [],
  balances: [],
  session: undefined,
};

const dataWC = reactive<IAppState>(INITIAL_STATE);

interface Request {
  body: RequestBody;
}

interface RequestBody {
  method: string;
  params?: { [key: string]: any };
}

export interface Response {
  error?: string;
  data?: any;
}

export default function useWallet() {
  const route = useRoute();

  const disconnect = async () => {
    console.log('[disconnect]', dataWC.client);
    console.log('[disconnect]', dataWC.session);
    if (!dataWC.client) return false;
    const topic = dataWC.session.topic;
    await disconnectNoticeWallet(topic);
    reset();
    await dataWC.client.disconnect({
      topic,
      reason: getSdkError('USER_DISCONNECTED'),
    });
    return true;
  };

  // const onConnected = async (session: SessionTypes.Settled) => {
  //   dataWC.session = session;
  //   //Only use the first account
  //   const account = session.state.accounts[0];
  //   const [namespace, network, data] = account.split(':');
  //   const [alias, domain, address, signedMessage] = data.split('|');
  //   const username = domain ? `${alias}@${domain}` : address;
  //   const message = session.self.publicKey;
  //   const result = Message.verify(message, address, signedMessage);
  //   if (!result) {
  //     await disconnect();
  //     throw new Error('InvalidAccount');
  //   }
  //   dataWC.account = { username, alias, domain, address };
  //   console.log(dataWC.account);

  //   const balances = await getAccountBalances(session, username);
  //   dataWC.account.balances = balances;
  // };

  const disconnectNoticeWallet = async (topic: string) => {
    const request: Request = {
      body: { method: 'disconnect', params: { topic } },
    };
    await sendBaseRequest(request);
  };

  const getBalance = async (accounts: string[]) => {
    const request: Request = {
      body: { method: 'getBalance', params: { accounts } },
    };
    const response = await sendBaseRequest(request);
    if (response.data) {
      dataWC.balances = response.data
      return response.data
    }
  };

  const signMessage = async (
    message: IMessageParameters
  ): Promise<IMessageResult | undefined> => {
    const request: Request = {
      body: { method: 'signMessage', params: message },
    };
    const response = await sendBaseRequest(request);
    return response.data;
  };

  const sendTransaction = async (paymentParameters: ITransaction) => {
    const request: Request = {
      body: { method: 'sendTransaction', params: paymentParameters },
    };
    const response = await sendBaseRequest(request);
    return response.data;
  };

  const signTransaction = async (
    transactionParameters: ISignTransaction
  ): Promise<ISignTransactionResult> => {
    const request: Request = {
      body: { method: 'signTransaction', params: transactionParameters },
    };
    const response = await sendBaseRequest(request);
    return response.data;
  };

  const sendRawTransaction = async (txHexes: string[]) => {
    const request: Request = {
      body: { method: 'sendRawTransaction', params: { txHexes } },
    };
    return await sendBaseRequest(request);
  };

  const getNewAddress = async (): Promise<string> => {
    const request: Request = {
      body: { method: 'getNewAddress' },
    };
    const response = await sendBaseRequest(request);
    return response.data;
  };

  const verifyAddress = async (address: string) => {
    const request: Request = {
      body: { method: 'verifyAddress', params: { address } },
    };
    const response = await sendBaseRequest(request);
    return JSON.parse(response.data);
  };

  const mapToAccountObj = (
    allNamespaceAccounts: string[]
  ) => {
    return allNamespaceAccounts.map((account) => {
      const [namespace, network, data] = account.split(':');
      const [alias, domain, address, signedMessage] = data.split('|');
      const username = domain ? `${alias}@${domain}` : address;
      return { username, alias, domain, address };
    })
  };

  const sendBaseRequest = async (request: Request): Promise<Response> => {
    if (!dataWC.session || !dataWC.client) return { error: 'init error' };
    const { method, params } = request.body;
    const topic = dataWC.session.topic;
    console.info('rpc', method, params, topic);
    const response = await dataWC.client.request({
      topic,
      chainId: dataWC.currentChainId,
      request: { method, params },
    });
    console.info(`${method} response:`, response);
    return { data: response };
  };

  const connect = async (pairing?: any) => {
    if (typeof dataWC.client === 'undefined') {
      throw new Error('WalletConnect is not initialized');
    }
    console.log('connect, pairing topic is:', pairing?.topic);
    try {
      const requiredNamespaces = {
        bsv: {
          chains: BSV_CHAINS,
          methods: allowMethods,
          events: ['chainChanged', 'accountsChanged'],
        },
        rxd: {
          chains: RXD_CHAINS,
          methods: allowMethods,
          events: ['chainChanged', 'accountsChanged'],
        },
      };

      const { uri, approval } = await dataWC.client.connect({
        pairingTopic: pairing?.topic,
        requiredNamespaces,
      });

      // Open QRCode modal if a URI was returned (i.e. we're not connecting an existing pairing).
      if (uri) {
        // Create a flat array of all requested chains across namespaces.
        const standaloneChains = Object.values(requiredNamespaces)
          .map((namespace) => namespace.chains)
          .flat();

        web3Modal.openModal({ uri, standaloneChains });
      }

      const session = await approval();
      console.log('Established session:', session);
      // @ts-ignore
      await onSessionConnected(session);
      // Update known pairings after session is connected.
      dataWC.pairings = dataWC.client.pairing.getAll({ active: true });
    } catch (e) {
      console.error(e);
      // ignore rejection
    } finally {
      // close modal in case it was open
      web3Modal.closeModal();
    }
  };

  const reset = () => {
    dataWC.session = undefined;
    dataWC.accounts = [];
    dataWC.balances = [];
    dataWC.chains = [];
  };

  const onSessionConnected = async (_session: SessionTypes.Struct) => {
    console.log(_session.namespaces)
    const allNamespaceAccounts = Object.values(_session.namespaces)
      .map((namespace) => namespace.accounts)
      .flat();
    const allNamespaceChains = Object.keys(_session.namespaces);

    dataWC.session = _session;
    dataWC.chains = allNamespaceChains;
    dataWC.accounts = mapToAccountObj(allNamespaceAccounts);
    await getBalance(allNamespaceAccounts);
  };

  const _subscribeToEvents = async (_client: SignClient) => {
    if (typeof _client === 'undefined') {
      throw new Error('WalletConnect is not initialized');
    }

    _client.on('session_ping', (args) => {
      console.log('EVENT', 'session_ping', args);
    });

    _client.on('session_event', (args) => {
      console.log('EVENT', 'session_event', args);
    });

    _client.on('session_update', ({ topic, params }) => {
      console.log('EVENT', 'session_update', { topic, params });
      const { namespaces } = params;
      const _session = _client.session.get(topic);
      const updatedSession = { ..._session, namespaces };
      // @ts-ignore
      onSessionConnected(updatedSession);
    });

    _client.on('session_delete', () => {
      console.log('EVENT', 'session_delete');
      reset();
    });
  };

  const _checkPersistedState = async (_client: SignClient) => {
    if (typeof _client === 'undefined') {
      throw new Error('WalletConnect is not initialized');
    }
    // populates existing pairings to state
    dataWC.pairings = _client.pairing.getAll({ active: true });
    console.log(
      'RESTORED PAIRINGS: ',
      _client.pairing.getAll({ active: true })
    );

    if (typeof dataWC.session !== 'undefined') return;
    // populates (the last) existing session to state
    if (_client.session.length) {
      const lastKeyIndex = _client.session.keys.length - 1;
      const _session = _client.session.get(_client.session.keys[lastKeyIndex]);
      console.log('RESTORED SESSION:', _session);
      // @ts-ignore
      await onSessionConnected(_session);
      return _session;
    }
  };

  const createClient = async () => {
    try {
      dataWC.isInitializing = true;

      const _client = await SignClient.init({
        projectId: '1adba0cb85fb70e09109ade51290d777',
        metadata: {
          name: 'Example Dapp',
          description: 'Example Dapp',
          url: '#',
          icons: ['https://chainbow.io/chainbow-logo.svg'],
        },
      });

      await _subscribeToEvents(_client);
      await _checkPersistedState(_client);
      dataWC.client = _client;
    } catch (err) {
      throw err;
    } finally {
      dataWC.isInitializing = false;
    }
  };

  onMounted(() => {
    if (!dataWC.client) createClient();
  });

  return {
    ...toRefs(dataWC),
    connect,
    disconnect,
    signMessage,
    sendTransaction,
    signTransaction,
    sendRawTransaction,
    getNewAddress,
    verifyAddress,
    getBalance,
  };
}
