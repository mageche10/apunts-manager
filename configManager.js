const fs = require('fs')
const path = require('path')

const configPath = path.join(__dirname, '/data/config.json') //cambiar por path.join(app.getPath('userData'), 'config.json'); una vez en produccion
const configTemplate = {
    assignatures: [
        {
            nom: "Assignatura I",
            abb: "AS I"
        }
    ],
    dataPath: "",
    VSEnvPath: ""
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
    }
}

module.exports = ConfigManager;