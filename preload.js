const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
    getSubjectsData: () => ipcRenderer.invoke('getSubjectsData'),
    saveSubjectsData: (data) => ipcRenderer.invoke('saveSubjectsData', data), 
    getDataPath: () => ipcRenderer.invoke('getDataPath'),
    saveDataPath: (data) => ipcRenderer.invoke('saveDataPath', data),

    getAllTemes: (data) => ipcRenderer.invoke('getAllTemes', data),

    openDirectorySelector: () => ipcRenderer.invoke('openDirectorySelector')

})