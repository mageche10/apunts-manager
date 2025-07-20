const { app } = require('electron')
const fs = require('fs')
const path = require('path')

//TODO: marcar el config como extrafiles en electron builder
//No es la millor manera utilitzar resourcesPath pero prefereixo aixo que no tenir la config en el roaming perduda
const configPath = app.isPackaged ? path.join(process.resourcesPath, 'config.json') : path.join(__dirname, '/data/config.json') 

const configTemplate = {
    assignatures: [
        {
            nom: "Assignatura I",
            abb: "AS I"
        }
    ],
    dataPath: "",
    VSEnvPath: "",
    DefaultOutputPath: "",
    InkscapePath: "",
    SumatraPath: "",
    colorMap: [
        { name: "Taronja", primary: "0xFFF1E6", secondary: "0xFF9233" },
        { name: "Vermell", primary: "0xFFE6E6", secondary: "0xFF3333" },
        { name: "Violeta", primary: "0xF0E6FF", secondary: "0xA366FF" },
        { name: "Groc", primary: "0xFFFFE6", secondary: "0xFFD333" },
        { name: "Blau", primary: "0xE6F2FF", secondary: "0x3399FF" },
        { name: "Verd", primary: "0xDCF5E5", secondary: "0x58C75F" }
  ]
}

const ConfigManager = {
    getAllConfig (){
        return JSON.parse(fs.readFileSync(configPath, "utf-8"))
    },

    changeEntry (entry, value){
        try {
            configObj = this.getAllConfig()
            configObj[entry] = value
            fs.writeFileSync(configPath, JSON.stringify(configObj, null, 2))
            return true
        } catch (err) {
            return false
        }
    },

    async checkFile() {
        if (!fs.existsSync(configPath)) {
            fs.writeFileSync(configPath, JSON.stringify(configTemplate, null, 2))
        }
    },

    getDataPath (){
        return this.getAllConfig().dataPath
    },

    saveDataPath (path) {
        this.changeEntry("dataPath", path)
    },

    getVSEnvPath (){
        return this.getAllConfig().VSEnvPath
    },

    saveVSEnvPath (path) {
        this.changeEntry("VSEnvPath", path)
    },

    getDefaultOutputPath (){
        return this.getAllConfig().DefaultOutputPath
    },

    saveDefaultOutputPath (path) {
        this.changeEntry("DefaultOutputPath", path)
    },

    getSumatraPath (){
        return this.getAllConfig().SumatraPath
    },

    saveSumatraPath (path) {
        this.changeEntry("SumatraPath", path)
    },

    getInkscapePath (){
        return this.getAllConfig().InkscapePath
    },

    saveInkscapePath (path) {
        this.changeEntry("InkscapePath", path)
    },

    getSubjectsData() {
        const obj = this.getAllConfig()
        return obj.assignatures
    },

    saveSubjectsData(subjects) {
        try {
            configObj = this.getAllConfig()
            configObj.assignatures = subjects
            fs.writeFileSync(configPath, JSON.stringify(configObj, null, 2))
            return true
        } catch (err) {
            return false
        }
    },

    getColorMap() {
        const obj = this.getAllConfig()
        const colorMap = obj.colorMap
        return colorMap.map(color => {
            return{
                name: color.name,
                primary: parseInt(color.primary, 16),
                secondary: parseInt(color.secondary, 16)
            }
        })
    }
}

module.exports = ConfigManager;