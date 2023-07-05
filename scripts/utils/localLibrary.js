import config from '../config';

export default {
  _getList() {
    try {
      return localStorage.getItem(config.localLibraryName) ? JSON.parse(localStorage.getItem(config.localLibraryName)) : [];
    } catch (e) {
      return [];
    }
  },

  _saveList(list) {
    try {
      localStorage.setItem(config.localLibraryName, JSON.stringify(list));
    } catch (e) {

    }
  },

  add(item) {
    const storageList = this._getList();

    storageList.push(item);

    this._saveList(storageList);
  },

  remove(item) {
    let storageList = this._getList();

    // reject objects with id equal to item or the item id
    storageList = storageList.filter((listItem) => {
      if (typeof item === 'object') {
        return listItem.id !== item.id;
      }
      return listItem.id !== item;
    });

    this._saveList(storageList);
  },

  find(item) {
    const storageList = this._getList();

    return storageList.find((storageItem) => storageItem.id === item.id);
  },

  list() {
    return this._getList();
  },
};
