const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
    getAllTemes: (data) => ipcRenderer.invoke('getAllTemes', data),

    editarTema: (index, subjectArg) => ipcRenderer.invoke("editarTema", index, subjectArg),
    verTema: (index, subjectArg) => ipcRenderer.invoke("verTema", index, subjectArg),
    newTema: (index, subjectArg) => ipcRenderer.invoke("newTema", index, subjectArg)
})

contextBridge.exposeInMainWorld('configApi', {
    getSubjectsData: () => ipcRenderer.invoke('getSubjectsData'),
    saveSubjectsData: (data) => ipcRenderer.invoke('saveSubjectsData', data), 
    getDataPath: () => ipcRenderer.invoke('getDataPath'),
    saveDataPath: (data) => ipcRenderer.invoke('saveDataPath', data),
    getVSEnvPath: () => ipcRenderer.invoke('getVSEnvPath'),
    saveVSEnvPath: (data) => ipcRenderer.invoke('saveVSEnvPath', data),

    openDirectorySelector: (initialPath) => ipcRenderer.invoke('openDirectorySelector', initialPath)
})