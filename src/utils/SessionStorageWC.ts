import { IKeyValueStorage } from 'keyvaluestorage';
import { SessionStorage } from 'quasar';

export class SessionStorageWC implements IKeyValueStorage {
  public async getKeys(): Promise<string[]> {
    return Promise.resolve(SessionStorage.getAllKeys())
  }

  public async getEntries(): Promise<any> {
    return Promise.resolve(SessionStorage.getAllKeys())
  }

  public async getItem(key: string): Promise<any> {
    let res: any = SessionStorage.getItem(key)
    if (res === null) {
      res = undefined
    }
    return Promise.resolve(res)
  }

  public async setItem(key: string, value: any): Promise<void> {
    return Promise.resolve(SessionStorage.set(key, value))
  }

  public async removeItem(key: string): Promise<void> {
    return Promise.resolve(SessionStorage.remove(key))
  }
}

export default new SessionStorageWC();
