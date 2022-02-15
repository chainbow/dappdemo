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

import { openURL } from 'quasar';
import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/client';
import {
  PairingTypes,
  SessionTypes,
  AppMetadata,
  ClientOptions,
} from '@walletconnect/types';
import { ERROR } from '@walletconnect/utils';
import { reactive, readonly, toRefs } from 'vue';
import QRCodeModal from '@walletconnect/qrcode-modal';
const Message = require('bsv/message');
const TIMEOUT = 300000;

import {
  APPROVAL_METHODS,
  NON_APPROVAL_METHODS,
  CHAIN_ID,
  DEFAULT_RELAY_PROVIDER,
  IAccount,
  IAccountBalances,
  IMessageParameters,
  IMessageResult,
  ISignTransaction,
  IAssetData,
  ITransaction,
} from './useWalletTypes';
import SessionStorageWC from 'src/utils/SessionStorageWC';
import { Notify } from 'quasar';
import { useRoute } from 'vue-router';

interface IAppState {
  initialized: boolean;
  wallet: string | undefined;
  client?: WalletConnectClient;
  session?: SessionTypes.Created;
  account?: IAccount;
}

const INITIAL_STATE: IAppState = {
  initialized: false,
  wallet: undefined,
  client: undefined,
  session: undefined,
  account: undefined,
};

const dataWC = reactive<IAppState>(INITIAL_STATE);

export default function useWallet(
  appSchema = 'chainbow',
  opts?: ClientOptions
) {
  const disconnect = async () => {
    try {
      if (
        dataWC.client &&
        dataWC.client.session &&
        dataWC.client.session.topics
      ) {
        for (const topic of dataWC.client.session.topics) {
          await dataWC.client.disconnect({
            topic: topic,
            reason: ERROR.USER_DISCONNECTED.format(),
          });
        }
      }
    } catch (error) {
      // disconnect from wallet no need to handle
      console.log(error);
    }
    dataWC.session = undefined;
    dataWC.account = undefined;
    return true;
  };

  const onConnected = async (session: SessionTypes.Settled) => {
    dataWC.session = session;
    //Only use the first account
    const account = session.state.accounts[0];
    const [namespace, network, data] = account.split(':');
    const [alias, domain, address, signedMessage] = data.split('|');
    const username = domain ? `${alias}@${domain}` : address;
    const message = session.self.publicKey;
    const result = Message.verify(message, address, signedMessage);
    if (!result) {
      await disconnect();
      throw new Error('InvalidAccount');
    }

    dataWC.account = {
      username,
      alias,
      domain,
      address,
    };
    console.log(dataWC.account);

    const balances = await getAccountBalance(session, username);
    dataWC.account.balances = balances;
  };

  const assets2Balance = (assets: IAssetData[]) => {
    const balances: IAccountBalances = {};
    assets.forEach((asset: IAssetData) => {
      const key = asset.contract ? asset.contract : asset.symbol;
      balances[key] = asset;
    });
    return balances;
  };

  const getAccountBalance = async (
    session: SessionTypes.Settled,
    username: string
  ) => {
    if (!dataWC.client) {
      throw new Error('NoConnection');
    }
    if (session.topic) {
      const params: SessionTypes.RequestParams = {
        timeout: TIMEOUT,
        topic: session.topic,
        chainId: CHAIN_ID,
        request: {
          method: NON_APPROVAL_METHODS.getBalance,
          params: username,
        },
      };
      const assets: IAssetData[] = await dataWC.client.request(params);
      console.log('getAccountBalances', assets);
      return assets2Balance(assets);
    }
  };

  const signMessage = async (
    message: IMessageParameters
  ): Promise<IMessageResult | undefined> => {
    const params: SessionTypes.RequestParams = {
      timeout: TIMEOUT,
      topic: dataWC.session?.topic ?? '',
      chainId: CHAIN_ID,
      request: {
        method: APPROVAL_METHODS.signMessage,
        params: message,
      },
    };
    const res = await dataWC.client?.request(params);
    console.log(res);
    return res;
  };

  const sendTransaction = async (paymentParameters: ITransaction) => {
    if (!dataWC.client || !dataWC.session) {
      throw new Error('NoConnection');
    }

    const res = await dataWC.client.request({
      timeout: TIMEOUT,
      topic: dataWC.session.topic,
      chainId: CHAIN_ID,
      request: {
        method: APPROVAL_METHODS.sendTransaction,
        params: paymentParameters,
      },
    });
    return res;
  };

  const signTransaction = async (transactionParameters: ISignTransaction) => {
    if (!dataWC.client || !dataWC.session) {
      throw new Error('NoConnection');
    }
    const res = await dataWC.client.request({
      timeout: TIMEOUT,
      topic: dataWC.session.topic,
      chainId: CHAIN_ID,
      request: {
        method: APPROVAL_METHODS.signTransaction,
        params: transactionParameters,
      },
    });
    return res;
  };

  const sendRawTransaction = async (txHexArray: string[]) => {
    if (!dataWC.client || !dataWC.session) {
      throw new Error('NoConnection');
    }
    const res = await dataWC.client.request({
      timeout: TIMEOUT,
      topic: dataWC.session.topic,
      chainId: CHAIN_ID,
      request: {
        method: APPROVAL_METHODS.sendRawTransaction,
        params: txHexArray,
      },
    });
    return res;
  };

  const getBalance = () => {
    if (dataWC.account) {
      const balances = dataWC.account.balances;
      return balances;
    }
  };

  const getNewAddress = async () => {
    if (!dataWC.client || !dataWC.session) {
      throw new Error('NoConnection');
    }
    const res = await dataWC.client.request({
      timeout: TIMEOUT,
      topic: dataWC.session.topic,
      chainId: CHAIN_ID,
      request: {
        method: NON_APPROVAL_METHODS.getNewAddress,
      },
    });
    return res;
  };

  const verifyAddress = async (address: string) => {
    if (!dataWC.client || !dataWC.session) {
      throw new Error('NoConnection');
    }
    const res = await dataWC.client.request({
      timeout: TIMEOUT,
      topic: dataWC.session.topic,
      chainId: CHAIN_ID,
      request: {
        method: NON_APPROVAL_METHODS.verifyAddress,
        params: address,
      },
    });
    return res;
  };

  const connect = async (metadata: AppMetadata) => {
    try {
      const methods = Object.values({
        ...APPROVAL_METHODS,
        ...NON_APPROVAL_METHODS,
      });
      const session = await dataWC.client?.connect({
        metadata: metadata,
        pairing: undefined,
        permissions: {
          blockchain: {
            chains: [CHAIN_ID],
          },
          jsonrpc: {
            methods,
          },
        },
      });
      console.info('connectWc instance session', session);
      if (
        session &&
        session.state.accounts &&
        session.state.accounts.length > 0
      ) {
        await onConnected(session);
      }
    } catch (e) {
      // ignore rejection
    }

    // close modal in case it was open
    QRCodeModal.close();
  };

  const subscribeToEvents = (client: WalletConnectClient) => {
    client.on(
      CLIENT_EVENTS.pairing.proposal,
      (proposal: PairingTypes.Proposal) => {
        const { uri } = proposal.signal.params;
        console.log('EVENT', 'QR Code Modal open');
        if (dataWC.wallet) {
          openURL(`${dataWC.wallet}://wc?uri=${uri}`);
        } else {
          QRCodeModal.open(
            uri,
            () => {
              console.log('EVENT', 'QR Code Modal closed');
            },
            {
              mobileLinks: [appSchema],
            }
          );
        }
      }
    );

    client.on(
      CLIENT_EVENTS.session.deleted,
      async (session: SessionTypes.Settled) => {
        if (session.topic !== dataWC.session?.topic) return;
        console.log('EVENT', 'session_deleted');
        await disconnect();
      }
    );

    client.on(
      CLIENT_EVENTS.session.notification,
      (session: SessionTypes.Settled) => {
        // @ts-ignore
        if (session.notification && session.notification.type === 'balance') {
          // @ts-ignore
          if (dataWC.account)
            // @ts-ignore
            dataWC.account.balances = assets2Balance(session.notification.data);
        }
      }
    );
  };

  const checkPersistedState = async (client: WalletConnectClient) => {
    console.log(dataWC);
    if (client.session.topics.length > 0) {
      const session = await client.session.get(client.session.topics[0]);
      await onConnected(session);
    }
  };

  const init = async (opts?: ClientOptions) => {
    console.log(dataWC);
    if (!dataWC.initialized) {
      const route = useRoute();
      const location = new URL(window.location.href);
      const wallet =
        location.searchParams.get('wallet') || route.query['wallet'];
      dataWC.wallet = wallet ? wallet.toString() : undefined;

      dataWC.initialized = true;
      dataWC.client = await WalletConnectClient.init(
        Object.assign(
          {
            relayUrl: DEFAULT_RELAY_PROVIDER,
            storage: SessionStorageWC,
          } as ClientOptions,
          opts ?? {}
        )
      );
      if (dataWC.client) {
        //@ts-ignore
        subscribeToEvents(dataWC.client);
        //@ts-ignore
        await checkPersistedState(dataWC.client);
      }
    }
  };

  void init(opts);

  return {
    ...toRefs(dataWC),
    connect,
    disconnect,
    getBalance,
    signMessage,
    sendTransaction,
    signTransaction,
    sendRawTransaction,
    getNewAddress,
    verifyAddress
  };
}
