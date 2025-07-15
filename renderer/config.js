import { mostrarErrorToast } from "./util.js";

export async function cargarConfig(assignatures){
    const contenido = document.getElementById('contenido');
    window.currentSubject = null

    contenido.innerHTML = `
        <h1>Configuración</h1>
        <div class="px-3">
        <div class=config-line>Editar assignatures <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalEditSubjects"> Editar </button> </div>
        <div class=config-line> <span id="dataPathLine">Ruta a la carpeta d'apunts: ${await window.configApi.getDataPath()} </span><button id="dataDirectorySelector" type="button" class="btn btn-primary"> Cambiar </button></div>
        <div class=config-line> <span id="VSEnvPathLine">Ruta a la carpeta de l'entorn de VS Code: ${await window.configApi.getVSEnvPath()} </span><button id="VSEnvDirectorySelector" type="button" class="btn btn-primary"> Cambiar </button></div>
        <div class=config-line> <span id="DefaultOutputPathLine">Ruta de sortida predeterminada: ${await window.configApi.getDefaultOutputPath()} </span><button id="DefaultOutputPathDirectorySelector" type="button" class="btn btn-primary"> Cambiar </button></div>
        <div class=config-line> <span id="SumatraPathLine">Ruta de Sumatra (PDF Viewer): ${await window.configApi.getSumatraPath()} </span><button id="SumatraPathDirectorySelector" type="button" class="btn btn-primary"> Cambiar </button></div>
        <div class=config-line> <span id="InkscapePathLine">Ruta de Inkscape: ${await window.configApi.getInkscapePath()} </span><button id="InkscapePathDirectorySelector" type="button" class="btn btn-primary"> Cambiar </button></div>
        </div>
    `

    contenido.insertAdjacentHTML('beforeend', modalEditSubjectsHTML())

    document.getElementById('dataDirectorySelector').addEventListener('click', async () => {
        const path = await window.configApi.openDirectorySelector(await window.configApi.getDataPath())
        if (path != null) {
            window.configApi.saveDataPath(path)
            document.getElementById("dataPathLine").innerText = `Ruta a la carpeta d'apunts: ${path}`
        }
    })

    document.getElementById('VSEnvDirectorySelector').addEventListener('click', async () => {
        const path = await window.configApi.openDirectorySelector(await window.configApi.getVSEnvPath())
        if (path != null) {
            window.configApi.saveVSEnvPath(path)
            document.getElementById("VSEnvPathLine").innerText = `Ruta a la carpeta de l'entorn de VS Code: ${path}`
        }
    })

    document.getElementById('DefaultOutputPathDirectorySelector').addEventListener('click', async () => {
        const path = await window.configApi.openDirectorySelector(await window.configApi.getDefaultOutputPath())
        if (path != null) {
            window.configApi.saveDefaultOutputPath(path)
            document.getElementById("DefaultOutputPathLine").innerText = `Ruta de sortida predeterminada: ${path}`
        }
    })

    document.getElementById('SumatraPathDirectorySelector').addEventListener('click', async () => {
        const path = await window.configApi.openExeSelector(await window.configApi.getSumatraPath())
        if (path != null) {
            window.configApi.saveSumatraPath(path)
            document.getElementById('SumatraPathLine').innerText = `Ruta de Sumatra (PDF Viewer): ${path}`
        }
    })

    document.getElementById('InkscapePathDirectorySelector').addEventListener('click', async () => {
        const path = await window.configApi.openExeSelector(await window.configApi.getInkscapePath())
        if (path != null) {
            window.configApi.saveInkscapePath(path)
            document.getElementById('InkscapePathLine').innerText = `Ruta de Inkscape: ${path}`
        }
    })


    //Cargar el modal al darle a editar asignaturas
    const editSubjectsModalBody = document.getElementById('modalBodyEditSubjects')
    const editSubjectsModal = document.getElementById('modalEditSubjects')
    editSubjectsModal.addEventListener('show.bs.modal', () => {
        editSubjectsModalBody.innerHTML = `<button id="addSubject" type="button" class="btn btn-primary w-100">Nova assignatura</button>`
        const addSubjectBtn = document.getElementById("addSubject")

        assignatures.forEach(assignatura => {
            addSubjectBtn.insertAdjacentHTML("beforebegin", filaAssignaturaHTML(assignatura.nom, assignatura.abb))
        })
        document.querySelectorAll('.deleteSubject').forEach(e => {
            e.addEventListener('click', () => {
                e.parentNode.parentNode.remove()
            })
        })

        document.getElementById("addSubject").addEventListener('click', () => {
            addSubjectBtn.insertAdjacentHTML("beforebegin", filaAssignaturaHTML("", ""))
            document.querySelectorAll('.deleteSubject').forEach(e => {
                e.addEventListener('click', () => {
                    e.parentNode.parentNode.remove()
                })
            })
        })
    })

    //Guardar assignaturas
    document.getElementById("saveSubjectsBtn").addEventListener('click', async () => {
        const abreviacions = Array.from(document.getElementsByName("abb")).map(i => i.value);
        const noms = Array.from(document.getElementsByName("nom")).map(i => i.value);
        if (new Set(abreviacions).size == abreviacions.length && !abreviacions.includes("")) {
            const subjects = []
            for (let n = 0; n < noms.length; n++) {
                subjects.push({
                    nom: noms[n],
                    abb: abreviacions[n]
                })
            }
            const result = await window.configApi.saveSubjectsData(subjects)

            if (result) {
                bootstrap.Modal.getOrCreateInstance(editSubjectsModal).hide()
                location.reload();
                cargarConfig()
            } else {
                throw "No s'ha pogut guardar :("
            }

            
        } else {
            mostrarErrorToast("No poden haver assignatures amb codis duplicats o buïts.")
        }
        
    })
}

function modalEditSubjectsHTML() {
    return `<div id="modalEditSubjects" class="modal fade" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false" aria-labelledby="staticBackdropLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Editar assignatures</h5>
                    </div>
                    <div class="modal-body" id="modalBodyEditSubjects">
                        
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Descartar</button>
                        <button type="button" class="btn btn-primary" id="saveSubjectsBtn">Guardar</button>
                    </div>
                </div>
            </div>
        </div>`
}

function filaAssignaturaHTML(nom, abb) {
        return `<div class="row mb-3 d-flex">
      <div class="col-8">
        <div class="form-floating">
          <input name="nom" type="text" class="form-control" value="${nom}">
          <label>Nom</label>
        </div>
      </div>
      <div class="col-2 p-0">
        <div class="form-floating">
          <input name="abb" type="text" class="form-control" value="${abb}">
          <label>Codi</label>
        </div>
      </div>
      <div class="col-1"><button type="button" class="btn-close deleteSubject" ></button></div>
    </div>`
}


