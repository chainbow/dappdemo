/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-var-requires */
global.Buffer = global.Buffer || require("buffer").Buffer;
global.process = global.process || require("process");

import SignClient from "@walletconnect/sign-client";
import { Web3Modal } from "@web3modal/standalone";
import WalletConnectClient from "@walletconnect/client";
import { AppMetadata, ClientOptions, SessionTypes } from "@walletconnect/types";
import { reactive, toRefs } from "vue";
import { CHAIN_ID, DEFAULT_RELAY_PROVIDER, IAccount, IAccountBalances, IAssetData, IMessageParameters, IMessageResult, ISignTransaction, ISignTransactionResult, ITransaction } from "./useWalletTypes";
import { getSdkError } from "@walletconnect/utils";

const Message = require("bsv/message");
const TIMEOUT = 300000;

interface IAppState {
  initialized: boolean;
  wallet: string | undefined;
  client?: SignClient;
  session?: any;
  account?: IAccount;
  currentChainId: string;

}

const INITIAL_STATE: IAppState = {
  initialized: false,
  currentChainId: CHAIN_ID,
  wallet: undefined,
  client: undefined,
  session: undefined,
  account: undefined
};

const dataWC = reactive<IAppState>(INITIAL_STATE);


interface Request {
  chainId: string,
  body: RequestBody
}

interface RequestBody {
  method: string;
  params?: { [key: string]: any };
}

export interface Response {
  error?: string;
  data?: any;
}


export default function useWallet(appSchema = "chainbow", opts?: ClientOptions) {

  const disconnect = async () => {
    console.log("[disconnect]", dataWC.client);
    console.log("[disconnect]", dataWC.session);
    if (!dataWC.client) return false;
    const topic = dataWC.session.topic;
    await disconnectNoticeWallet(topic);
    dataWC.session = undefined;
    dataWC.account = undefined;
    await dataWC.client.disconnect({ topic, reason: getSdkError("USER_DISCONNECTED") });
    return true;
  };

  const onConnected = async (session: SessionTypes.Settled) => {
    dataWC.session = session;
    //Only use the first account
    const account = session.state.accounts[0];
    const [namespace, network, data] = account.split(":");
    const [alias, domain, address, signedMessage] = data.split("|");
    const username = domain ? `${ alias }@${ domain }` : address;
    const message = session.self.publicKey;
    const result = Message.verify(message, address, signedMessage);
    if (!result) {
      await disconnect();
      throw new Error("InvalidAccount");
    }
    dataWC.account = { username, alias, domain, address };
    console.log(dataWC.account);

    const balances = await getAccountBalance(session, username);
    dataWC.account.balances = balances;
  };

  const disconnectNoticeWallet = async (topic: string) => {
    const request: Request = { chainId: CHAIN_ID, body: { method: "disconnect", params: { topic } } };
    await sendBaseRequest(request);
  };

  const assets2Balance = (assets: IAssetData[]) => {
    const balances: IAccountBalances = {};
    assets.forEach((asset: IAssetData) => {
      const key = asset.contract ? asset.contract : asset.symbol;
      balances[key] = asset;
    });
    return balances;
  };

  const getAccountBalance = async (session?: SessionTypes.Settled | undefined, username?: string) => {
    const request: Request = { chainId: CHAIN_ID, body: { method: "getBalance", params: { username } } };
    const response = await sendBaseRequest(request);
    return assets2Balance(response.data);
  };

  const signMessage = async (message: IMessageParameters): Promise<IMessageResult | undefined> => {
    const request: Request = { chainId: CHAIN_ID, body: { method: "signMessage", params: message } };
    const response = await sendBaseRequest(request);
    return response.data;
  };

  const sendTransaction = async (paymentParameters: ITransaction) => {
    const request: Request = { chainId: CHAIN_ID, body: { method: "sendTransaction", params: paymentParameters } };
    const response = await sendBaseRequest(request);
    return response.data;
  };

  const signTransaction = async (transactionParameters: ISignTransaction): Promise<ISignTransactionResult> => {
    const request: Request = { chainId: CHAIN_ID, body: { method: "signTransaction", params: transactionParameters } };
    const response = await sendBaseRequest(request);
    return response.data;
  };

  const sendRawTransaction = async (txHexArray: string[]) => {
    const request: Request = { chainId: CHAIN_ID, body: { method: "sendRawTransaction", params: txHexArray } };
    return await sendBaseRequest(request);
  };

  const getBalance = () => {
    if (dataWC.account) {
      const balances = dataWC.account.balances;
      return balances;
    }
  };

  const getNewAddress = async (): Promise<string> => {
    const request: Request = { chainId: CHAIN_ID, body: { method: "getNewAddress" } };
    const response = await sendBaseRequest(request);
    return response.data;
  };

  const verifyAddress = async (address: string) => {
    const request: Request = { chainId: CHAIN_ID, body: { method: "verifyAddress", params: { address } } };
    const response = await sendBaseRequest(request);
    return JSON.parse(response.data);
  };

  const finishConnectInitAccountInfo = async (account: any, message: string) => {
    const [namespace, network, data] = account.split(":");
    const [alias, domain, address, signedMessage] = data.split("|");
    const username = domain ? `${ alias }@${ domain }` : address;
    const result = Message.verify(message, address, signedMessage);
    if (!result) {
      await disconnect();
      throw new Error("InvalidAccount");
    }
    dataWC.account = { username, alias, domain, address };
    console.log(dataWC.account);
    const balances = await getAccountBalance(undefined, username);
    dataWC.account.balances = balances;
  };


  const subscribeToEvents = (client: WalletConnectClient) => {

  };

  const checkPersistedState = async (client: WalletConnectClient) => {
    console.log(dataWC);
    if (client.session.topics.length > 0) {
      const session = await client.session.get(client.session.topics[0]);
      await onConnected(session);
    }
  };

  const sendBaseRequest = async (request: { chainId: string, body: RequestBody }): Promise<Response> => {
    if (!dataWC.session || !dataWC.client) return { error: "init error" };
    const { method, params } = request.body;
    const topic = dataWC.session.topic;
    console.info("rpc 参数", method, params, topic);
    const response = await dataWC.client.request({ topic, chainId: dataWC.currentChainId, request: { method, params } });
    console.info(`${ method } 发送请求，返回值为`, response);
    return { data: response };
  };


  const connect = async (metadata: AppMetadata) => {
    if (!dataWC.client) return false;
    try {
      const web3Modal = new Web3Modal({
        walletConnectVersion: 2, projectId: "1adba0cb85fb70e09109ade51290d777"
      });
      const { uri, approval } = await dataWC.client.connect({});
      await web3Modal.openModal({ uri, standaloneChains: ["bsv"], route: "Account" });
      dataWC.session = await approval();
      console.info("[session]", dataWC.session);
      const unsubscribe = web3Modal.subscribeModal((newState) =>
        console.info("[subscribeModal]", dataWC.session)
      );
      unsubscribe();
      web3Modal.closeModal();

      const pairings = dataWC.client.core.pairing.getPairings();
      console.info("[pairings]", pairings);

      await finishConnectInitAccountInfo(dataWC.session.namespaces.bsv.accounts[0], dataWC.session.self.publicKey);

      return true;
    } catch (error: any) {
      return false;
    }

  };

  const init = async (opts?: ClientOptions) => {
    if (dataWC.client) return { error: "has been init" };
    const signClient = await SignClient.init({
      projectId: "1adba0cb85fb70e09109ade51290d777",
      metadata: {
        name: "Example Dapp",
        description: "Example Dapp",
        url: "#",
        icons: ["https://walletconnect.com/walletconnect-logo.png"]
      }
    });
    dataWC.client = signClient;


    signClient.on("session_delete", async (event) => {
      dataWC.session = undefined;
      dataWC.account = undefined;
    });

    signClient.core.pairing.events.on("pairing_delete", ({ id, topic }) => {
      console.info("[pairing.events]", id, topic);

    });

    signClient.core.pairing.events.on("pairing_proposal", ({ id, topic }) => {
      console.info("[proposal]", id, topic);

    });


    signClient.on("session_event", (event) => {
      // Handle session events, such as "chainChanged", "accountsChanged", etc.
      console.info("[session_event]", event);

    });

    signClient.on("session_update", ({ topic, params }) => {
      console.info("[session_update]", topic, params);

      // const { namespaces } = params;
      // const _session = signClient.session.get(topic);
      // // Overwrite the `namespaces` of the existing session with the incoming one.
      // const updatedSession = { ..._session, namespaces };
      // // Integrate the updated session state into your dapp state.
      // onSessionUpdate(updatedSession);
    });


    // if (!dataWC.initialized) {
    //   const route = useRoute();
    //   const location = new URL(window.location.href);
    //   const wallet =
    //     location.searchParams.get('wallet') || route.query['wallet'];
    //   dataWC.wallet = wallet ? wallet.toString() : undefined;
    //
    //   dataWC.initialized = true;
    //
    //   if (dataWC.client) {
    //     //@ts-ignore
    //     subscribeToEvents(dataWC.client);
    //     //@ts-ignore
    //     await checkPersistedState(dataWC.client);
    //   }
    // }
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
    verifyAddress,
    getAccountBalance
  };
}
