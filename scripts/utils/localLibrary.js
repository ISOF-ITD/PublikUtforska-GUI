import config from '../config';

export default {
  getList() {
    try {
      const list = localStorage.getItem(config.localLibraryName)
        ? JSON.parse(localStorage.getItem(config.localLibraryName))
        : [];

      if (!Array.isArray(list)) return [];

      return list.filter((item, index, fullList) => {
        if (!item?.id) return false;

        return fullList.findIndex(
          (candidate) => String(candidate?.id) === String(item.id),
        ) === index;
      });
    } catch (e) {
      return [];
    }
  },

  saveList(list) {
    try {
      localStorage.setItem(config.localLibraryName, JSON.stringify(list));
    } catch {
      // Ignore storage failures from private/incognito storage contexts.
    }
  },

  add(item) {
    const storageList = this.getList();
    const id = typeof item === 'object' ? item?.id : item;

    if (!id || this.find(id)) return;

    storageList.push({
      ...(typeof item === 'object' ? item : {}),
      id,
      savedAt: new Date().toISOString(),
    });

    this.saveList(storageList);
  },

  remove(item) {
    let storageList = this.getList();

    // reject objects with id equal to item or the item id
    storageList = storageList.filter((listItem) => {
      if (typeof item === 'object') {
        return String(listItem.id) !== String(item.id);
      }
      return String(listItem.id) !== String(item);
    });

    this.saveList(storageList);
  },

  find(item) {
    const storageList = this.getList();
    const id = typeof item === 'object' ? item?.id : item;

    return storageList.find(
      (storageItem) => String(storageItem.id) === String(id),
    );
  },

  list() {
    return this.getList();
  },
};
