const { app, BrowserWindow, ipcMain, dialog } = require("electron/main")
const path = require('path')

const ConfigManager = require('./configManager')
const TemesManager = require('./temesManager')

let win

const createWindow = () => {
    win = new BrowserWindow({
        width: 1050,
        height: 700,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.setMenuBarVisibility(false)
    win.loadFile('index.html')
}

app.whenReady().then(async () => {
    await ConfigManager.checkFile();
    ipcMain.handle('getSubjectsData', () => {
        return ConfigManager.getSubjectsData()
    })
    ipcMain.handle('saveSubjectsData', async (event, data) => {
        return ConfigManager.saveSubjectsData(data)
    })
    ipcMain.handle('getDataPath', () => ConfigManager.getDataPath())
    ipcMain.handle('saveDataPath', (event, data) => ConfigManager.saveDataPath(data))

    ipcMain.handle('getAllTemes', async (event, data) => {
        const temes = await TemesManager.getAllTemes(data)
        return temes
    })

    ipcMain.handle('openDirectorySelector', async () => {
        const result = await dialog.showOpenDialog(win, {properties: ['openDirectory', 'createDirectory']})
        if (result.canceled) {
            return null
        } else {
            return result.filePaths[0]
        }
    })

    createWindow()
})