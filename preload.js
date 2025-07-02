const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
    getAllTemes: (data) => ipcRenderer.invoke('getAllTemes', data),
    initSubject: (subjectCode) => ipcRenderer.invoke("initSubject", subjectCode),

    editarTema: (index, subjectCode) => ipcRenderer.invoke("editarTema", index, subjectCode),
    verTema: (index, subjectCode) => ipcRenderer.invoke("verTema", index, subjectCode),
    newTema: (index, subject) => ipcRenderer.invoke("newTema", index, subject),
    borrarTema: (index, subjectCode) => ipcRenderer.invoke("borrarTema", index, subjectCode),

    getErrates: (subjectCode) => ipcRenderer.invoke('getErrates', subjectCode),
    saveErrates: (subjectCode, data) => ipcRenderer.invoke('saveErrates', subjectCode, data),
    compileErrates: () => ipcRenderer.invoke('compileErrates'),

    generarApunts: (subject, tapa, ciutat = "barcelona") => ipcRenderer.invoke('generarApunts', subject, tapa, ciutat),
    generarApuntsAll: (tapa, ciutat = "barcelona") => ipcRenderer.invoke('generarApuntsAll', tapa, ciutat)
})

contextBridge.exposeInMainWorld('configApi', {
    getSubjectsData: () => ipcRenderer.invoke('getSubjectsData'),
    saveSubjectsData: (data) => ipcRenderer.invoke('saveSubjectsData', data), 
    getDataPath: () => ipcRenderer.invoke('getDataPath'),
    saveDataPath: (data) => ipcRenderer.invoke('saveDataPath', data),
    getVSEnvPath: () => ipcRenderer.invoke('getVSEnvPath'),
    saveVSEnvPath: (data) => ipcRenderer.invoke('saveVSEnvPath', data),
    getDefaultOutputPath: () => ipcRenderer.invoke('getDefaultOutputPath'),
    saveDefaultOutputPath: (data) => ipcRenderer.invoke('saveDefaultOutputPath', data),

    openDirectorySelector: (initialPath) => ipcRenderer.invoke('openDirectorySelector', initialPath)
})