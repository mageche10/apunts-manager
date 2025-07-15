const contenido = document.getElementById('contenido');
let currentSubject = null

//Carrega de la funcionalitat de la barra de navegació
document.addEventListener('DOMContentLoaded', async () => {
    const assignatures = await window.configApi.getSubjectsData()

    const nav = document.getElementById("nav-subjects")
    nav.innerHTML = ''

    assignatures.forEach(subject => {
        const li = document.createElement('li')
        li.classList.add("nav-item-custom")

        const a = document.createElement('a')
        a.href = "#"
        a.classList.add("nav-link-custom")
        a.dataset.seccion = subject.abb
        a.textContent = subject.nom
        a.addEventListener('click', (e) => {
            cargarAssignatura(subject)
        })

        li.appendChild(a);
        nav.appendChild(li);
    });

    configLink = document.getElementById("configLink").addEventListener('click', () => {
        cargarConfig(assignatures)
    })

    links = document.querySelectorAll('.nav-link-custom')
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            links.forEach(l => l.classList.remove('active-custom'))
            link.classList.add('active-custom')
        })
    })

    document.getElementById('compilarErratesBtn').addEventListener('click', async () => {
        const icon = document.getElementById('compilarEntradesIcon')
        icon.innerHTML = `<div class="spinner-border spinner-border-sm" role="status"> <span class="sr-only"></span></div>`

        const result = await window.api.compileErrates()
        if (result == false) {
            mostrarErrorToast("No s'ha pogut generar la fe d'errates")
        }
        icon.innerHTML = `<span class="material-symbols-outlined">file_export</span>`
        
    })
})

async function cargarAssignatura(assignatura) {
    currentSubject = assignatura

    contenido.classList.add("fade-out")
    contenido.addEventListener("transitionend", async function handler() {
        contenido.removeEventListener("transitionend", handler)

        contenido.innerHTML = `
            <div class="subject-navbar d-flex align-items-center">
                <p class="subject-title">${assignatura.nom}</p>
                <button id="temesButton" class="subject-nav-button active">Temes</button>
                <button id="figuresButton" class="subject-nav-button">Figures</button>
            </div>
            <div id="cards-container" class="cards-container-custom"> </div>
        `

        temes = await window.api.getAllTemes(assignatura.abb)

        if (temes == -1) {
            mostrarModalSeleccio("Crear arxius necessaris?", "Aquesta assignatura és nova i no té els arxius necessaris. Els vols crear ara?", () => {
                const result = window.api.initSubject(assignatura.abb)
                if (result == false) {
                    mostrarErrorToast("Error al crear els arxius base")
                } else {
                    cargarAssignatura (assignatura)
                }
            }, "Crear")
        } else {
            carregarTemes(assignatura)
        }

        const temesButton = document.getElementById('temesButton')
        const figuresButton = document.getElementById('figuresButton')

        temesButton.addEventListener('click', () => {
            figuresButton.classList.remove('active')
            carregarTemes(assignatura)
            temesButton.classList.add('active')
        })
        figuresButton.addEventListener('click', () => {
            temesButton.classList.remove('active')
            carregarFigures(assignatura)
            figuresButton.classList.add('active')
        })

        void contenido.offsetWidth
        contenido.classList.remove("fade-out")
        contenido.classList.add("fade-in")

        contenido.addEventListener("transitionend", function cleanup() {
            contenido.classList.remove("fade-in")
            contenido.removeEventListener("transitionend", cleanup)
        })
    })
}

async function carregarTemes(assignatura) {
    const temes = await window.api.getAllTemes(assignatura.abb)
    const cardsContainer = document.getElementById("cards-container")
    cardsContainer.innerHTML = ''

    temes.forEach((tema) => {
        const card = createCardTema(tema, assignatura, document)
        cardsContainer.append(card)
    })


    //Carrega del botó de nou tema
    const btnAdd = document.createElement("button")
    btnAdd.classList.add("btn", "btn-primary", "position-absolute", "btnTemaAdd", "floatingBtn")
    btnAdd.innerHTML = `<span class="material-symbols-outlined">add</span>`
    const index = temes.length + 1
    btnAdd.addEventListener('click', async () => newTema(index, assignatura))
    cardsContainer.append(btnAdd)

    //Carrega del botó errates i el seu modal
    const btnErratas = document.createElement("button")
    btnErratas.classList.add("btn", "btn-primary", "position-absolute", "btnErratas", "floatingBtn")
    btnErratas.innerHTML = `<span class="material-symbols-outlined">bug_report</span>`
    btnErratas.addEventListener('click', () => showErratasModal(assignatura))
    cardsContainer.insertAdjacentHTML('beforeend', HTMLconstants.modalErrates)
    cardsContainer.append(btnErratas)
    
    // Carregar botó de compilar tot i el seu modal
    const btnCompile = document.createElement("button")
    btnCompile.classList.add('btn', 'btn-primary', "position-absolute", "btnCompileAll", "floatingBtn")
    btnCompile.innerHTML = `<span class="material-symbols-outlined">menu_book</span>`
    cardsContainer.insertAdjacentHTML('beforeend', HTMLconstants.modalCompileAll(assignatura))
    btnCompile.addEventListener('click', () => showCompileAllModal(assignatura))
    cardsContainer.append(btnCompile)
}

async function carregarFigures(assignatura) {
    const cardsContainer = document.getElementById("cards-container")
    cardsContainer.innerHTML = ''

    const figures = await window.api.getAllFigures(assignatura.abb)
    figures.forEach((figure) => {
        const card = createFigureCard(figure, assignatura)
        cardsContainer.append(card)
    })

    //Carrega del boto new figure
    const btnNewFigure = document.createElement('button')
    btnNewFigure.classList.add("btn", "btn-primary", "position-absolute", "btnNewFigure", "floatingBtn")
    btnNewFigure.innerHTML = `<span class="material-symbols-outlined">add</span>`
    cardsContainer.insertAdjacentHTML('beforeend', HTMLconstants.modalNewFigure)
    btnNewFigure.addEventListener('click', async () => newFigure(assignatura))
    cardsContainer.append(btnNewFigure)
}

function editarTema(index, assignatura){
    const result = window.api.editarTema(index, assignatura.abb)
    if (!result) {
        mostrarErrorToast("Hi ha hagut un error al obrir VS Code.")
    }
}

async function verTema(index, assignatura){
    const div = document.getElementById(`verTemaDiv${index}`)
    div.innerHTML = `<div class="spinner-border spinner-border-sm" role="status"> <span class="sr-only"></span></div>`
    const result = await window.api.verTema(index, assignatura.abb)

    if (!result) {
        mostrarErrorToast("Hi ha hagut un error al compilar l'arxiu.")
    } 
    div.innerHTML = `<span class="material-symbols-outlined">visibility</span>`
}

function borrarTema(index, assignatura){
    mostrarModalConfirmar("Borrar tema", `Segur que vols borrar el Tema ${index}?`, async () => {
        const result = await window.api.borrarTema(index, assignatura.abb)
        
        if(result == false) {
            mostrarErrorToast("Error al borrar l'arxiu")
        } else {
            cargarAssignatura(assignatura)
        }
    }, "Eliminar")
}

function moreOptionsTema(){}

async function newTema(index, assignatura){
    const result = window.api.newTema(index, assignatura)

    if (result == false) {
        mostrarErrorToast("Error al crear un nou arxiu")
    } else {
        cargarAssignatura(assignatura)
    }
}

async function showErratasModal(assignatura) {
    const erratesModal = document.getElementById('modalErrates')
    const erratesModalBody = document.getElementById('modalBodyErrates')

    erratesModalBody.innerHTML = `<button id="addErrata" type="button" class="btn btn-primary w-100">Afegir errada</button>`
    const addErratabtn = document.getElementById('addErrata')

    const errates = await window.api.getErrates(assignatura.abb)
    errates.forEach(errada => {
        addErratabtn.insertAdjacentHTML('beforebegin', HTMLconstants.filaErrataHTML(errada.pag, errada.errada))
        document.querySelectorAll('.deleteErrata').forEach(e => {
            e.addEventListener('click', () => {
                e.parentNode.parentNode.remove()
            })
        })
    })

    addErratabtn.addEventListener('click', () => {
        addErratabtn.insertAdjacentHTML('beforebegin', HTMLconstants.filaErrataHTML(0, ""))
        document.querySelectorAll('.deleteErrata').forEach(e => {
            e.addEventListener('click', () => {
                e.parentNode.parentNode.remove()
            })
        })
    })

    document.getElementById("saveErratesBtn").addEventListener('click', async () => {
        const pags = Array.from(document.getElementsByName("pag")).map(i => i.value)
        const texts = Array.from(document.getElementsByName("errata")).map(i => i.value)
        if (!texts.includes("")) {
            var errates = []
            for (let n = 0; n < texts.length; n++) {
                errates.push({
                    pag: pags[n],
                    errada: texts[n]
                })
            }
            errates = errates.sort((a, b) => a.pag - b.pag)
            const result = await window.api.saveErrates(assignatura.abb, errates)

            if (result) {
                bootstrap.Modal.getOrCreateInstance(document.getElementById("modalErrates")).hide()
            } else {
                mostrarErrorToast("No s'ha pogut guardar :(")
            }
        } else {
            mostrarErrorToast("No poden haver errates sense text descriptiu")
        }
    })

    bootstrap.Modal.getOrCreateInstance(erratesModal).show()
}

function showCompileAllModal(assignatura) {
    const compileAllModal = document.getElementById('modalCompileAll')
    const body = document.getElementById('modalBodyCompileAll')
    const BSModal = bootstrap.Modal.getOrCreateInstance(compileAllModal)

    async function genericCompile (specificCompile) {
        document.getElementById("btnModalCompileClose").remove()

        const ciutat = document.getElementsByName('ciutat')[0].checked ? "barcelona" : "terrassa"

        body.innerHTML = `<div class="spinner-border" style="width: 4rem; height: 4rem;" role="status">
            <span class="sr-only"></span>
        </div>`
        body.classList.add('d-flex', 'justify-content-center', 'align-items-center')
        
        const result = await specificCompile(ciutat)

        if (result != true) {
            mostrarErrorToast(`No s'ha pogut generar el pdf: ${result}`)
        }

        compileAllModal.remove()
        BSModal.dispose()
        const cardsContainer = document.getElementById("cards-container")
        cardsContainer.insertAdjacentHTML('beforeend', HTMLconstants.modalCompileAll(assignatura))
    }

    document.getElementById('compileSubject').addEventListener('click', () => {
        genericCompile(async () => {
            return await window.api.generarApunts(assignatura, false)
        }) 
    })
    document.getElementById('compileSubjectCover').addEventListener('click', () => {
        genericCompile(async (ciutat) => {
            return await window.api.generarApunts(assignatura, true, ciutat)
        })
    })
    document.getElementById('compileAll').addEventListener('click', () => {
        genericCompile(async () => {
            const result = await window.api.generarApuntsAll(false)
            console.log(result)
            return result
        })
    })
    document.getElementById('compileAllCover').addEventListener('click', () => {
        genericCompile(async (ciutat) => {
            return await window.api.generarApuntsAll(true, ciutat)
        })
    })

    BSModal.show()
}

window.rendererApi.newFigureShortcut(async () => {
    if (currentSubject != null) {
        await carregarFigures(currentSubject)
        newFigure(currentSubject)
    } else {
        mostrarErrorToast("Selecciona una assignatura primer!")
    }
})

function newFigure(assignatura) {
    const modal = document.getElementById('modalNewFigure')
    const BSModal = bootstrap.Modal.getOrCreateInstance(modal)

    document.getElementById('modalCreateFigureButton').addEventListener('click', () => {
        const name = document.getElementById("modalFigureNom").value
        if (name != "") {
            const result = window.api.createFigure(name, assignatura.abb)

            if(result == false) {
                mostrarErrorToast("No s'ha pogut crear l'arxiu")
            }

            carregarFigures(assignatura)
            BSModal.hide()
        } else {
            mostrarErrorToast("El nom no pot estar buit.")
        }
    })

    BSModal.show()
}

function createCardTema(tema, subject) {
    const card = document.createElement("div")
    card.classList.add("card-custom")
    card.innerHTML = `Tema ${tema.index} <p class="subtitle">${tema.name}</p>`

    const options = document.createElement("div")
    options.classList.add("options")

    const rels = [
        [editarTema, '<span class="material-symbols-outlined">edit</span>'],
        [verTema, `<div class="optLoadingDiv" id="verTemaDiv${tema.index}"><span class="material-symbols-outlined">visibility</span></div>`],
        [moreOptionsTema, '<span class="material-symbols-outlined">more_horiz</span>'],
        [borrarTema, '<span class="material-symbols-outlined">delete</span>']
    ]
    const elements = []

    rels.forEach((rel) => {
        const btn = document.createElement("a")
        btn.href = "#"
        btn.addEventListener("click", () => { rel[0](tema.index, subject) })
        btn.innerHTML = rel[1]
        options.appendChild(btn)
        elements.push(btn)
    })
    elements[3].classList.add("delete-card")

    card.appendChild(options)

    return card
}

function createFigureCard(figure, assignatura) {
    const card = document.createElement("div")
    card.classList.add('card-figure-custom', 'card-custom')
    card.innerHTML = `<img src="${figure.file}"><p>${figure.name}</p>`

    const options = document.createElement("div")
    options.classList.add("options")

    const btnEdit = document.createElement("a")
    btnEdit.href = "#"
    btnEdit.addEventListener("click", () => { window.api.openInkscape(figure.file) })
    btnEdit.innerHTML = '<span class="material-symbols-outlined">edit</span>'
    options.appendChild(btnEdit)

    const btnInsertLatex = document.createElement("a")
    btnInsertLatex.href = "#"
    btnInsertLatex.addEventListener("click", () => { 
        window.api.insertOnLatex(figure.name) 
        mostrarPrimaryToast("Codi de Latex copiat al portapapers.")
    })
    btnInsertLatex.innerHTML = '<span class="material-symbols-outlined">add_circle</span>'
    options.appendChild(btnInsertLatex)

    const btnDeleteFigure = document.createElement("a")
    btnDeleteFigure.href = "#"
    btnDeleteFigure.addEventListener("click", () => { deleteFigure(assignatura, figure) })
    btnDeleteFigure.innerHTML = '<span class="material-symbols-outlined">delete</span>'
    btnDeleteFigure.classList.add("delete-card")
    options.appendChild(btnDeleteFigure)

    card.appendChild(options)

    return card
}

function deleteFigure(assignatura, figure){
    mostrarModalConfirmar("Borrar Figura", `Segur que vols borrar la figura ${figure.name}?`, async () => {
        const result = await window.api.deleteFigure(figure, assignatura)
        
        if(result == false) {
            mostrarErrorToast("Error al borrar l'arxiu")
        } else {
            carregarFigures(assignatura)
        }
    }, "Eliminar")
}

async function cargarConfig(assignatures){
    currentSubject = null

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

    contenido.insertAdjacentHTML('beforeend', HTMLconstants.modalEditSubjects)

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
            addSubjectBtn.insertAdjacentHTML("beforebegin", HTMLconstants.filaAssignaturaHTML(assignatura.nom, assignatura.abb))
        })
        document.querySelectorAll('.deleteSubject').forEach(e => {
            e.addEventListener('click', () => {
                e.parentNode.parentNode.remove()
            })
        })

        document.getElementById("addSubject").addEventListener('click', () => {
            addSubjectBtn.insertAdjacentHTML("beforebegin", HTMLconstants.filaAssignaturaHTML("", ""))
            document.querySelectorAll('.deleteSubject').forEach(e => {
                e.addEventListener('click', () => {
                    e.parentNode.parentNode.remove()
                })
            })
        })
    })

    //Guardar assignaturas
    document.getElementById("saveSubjectsBtn").addEventListener('click', async () => {
        abreviacions = Array.from(document.getElementsByName("abb")).map(i => i.value);
        noms = Array.from(document.getElementsByName("nom")).map(i => i.value);
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

function mostrarModalSeleccio(titol, cos, eventSi, btnConfirmText) {
    const modal = document.getElementById("modalSeleccio")
    document.getElementById("titleModalSeleccio").innerText = titol
    document.getElementById("bodyModalSeleccio").innerHTML = `<p>${cos}</p>`

    const oldButton = document.getElementById("btnSeleccioModalConfirmar");    
    const newButton = oldButton.cloneNode(true); 
    oldButton.parentNode.replaceChild(newButton, oldButton); 

    newButton.innerText = btnConfirmText
    newButton.addEventListener('click', eventSi)
    
    bootstrap.Modal.getOrCreateInstance(modal).show()
}

function mostrarModalConfirmar(titol, cos, eventDanger, btnDangerText) {
    const modal = document.getElementById("modalConfirmarAbortar")
    document.getElementById("titleModalConfirmar").innerText = titol
    document.getElementById("bodyModalConfirmar").innerHTML = `<p>${cos}</p>`

    const oldButton = document.getElementById("btnDangerModalConfirmar");    
    const newButton = oldButton.cloneNode(true); 
    oldButton.parentNode.replaceChild(newButton, oldButton); 

    newButton.innerText = btnDangerText
    newButton.addEventListener('click', eventDanger)
    
    bootstrap.Modal.getOrCreateInstance(modal).show()
}

function mostrarErrorToast(text) {
    const errorToast = document.getElementById("errorToast")
    document.getElementById("errorToastText").innerText = text
    bootstrap.Toast.getOrCreateInstance(errorToast).show()
}

function mostrarPrimaryToast(text){
    const primaryToast = document.getElementById("primaryToast")
    document.getElementById("primaryToastText").innerText = text
    bootstrap.Toast.getOrCreateInstance(primaryToast).show()
}

const HTMLconstants = {
    modalEditSubjects: `<div id="modalEditSubjects" class="modal fade" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false" aria-labelledby="staticBackdropLabel" aria-hidden="true">
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
        </div>`,

    filaAssignaturaHTML(nom, abb) {
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
    },

    modalErrates: `<div id="modalErrates" class="modal fade modal-lg" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false" aria-labelledby="staticBackdropLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Errates</h5>
                    </div>
                    <div class="modal-body" id="modalBodyErrates">
                        
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Descartar</button>
                        <button type="button" class="btn btn-primary" id="saveErratesBtn">Guardar</button>
                    </div>
                </div>
            </div>
        </div>`,
    
    filaErrataHTML(pag, errata) {
        return `<div class="row mb-3 d-flex">
      <div class="col-8">
        <div class="form-floating">
          <input name="errata" type="text" class="form-control" value="${errata}">
          <label>Errata</label>
        </div>
      </div>
      <div class="col-2 p-0">
        <div class="form-floating">
          <input name="pag" type="number" class="form-control" value="${pag}">
          <label>Pàg</label>
        </div>
      </div>
      <div class="col-1"><button type="button" class="btn-close deleteErrata" ></button></div>
    </div>`
    },

    modalCompileAll(assignatura){
        return `<div id="modalCompileAll" class="modal fade" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Generar Apunts</h5>
                        <button id="btnModalCompileClose" type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="modalBodyCompileAll">
                        <button id="compileSubject" type="button" class="btn btn-primary w-100 mb-2">Generar apunts - ${assignatura.nom}</button>
                        <button id="compileSubjectCover" type="button" class="btn btn-primary w-100 mb-2">Generar apunts amb tapa - ${assignatura.nom}</button>
                        <button id="compileAll" type="button" class="btn btn-primary w-100 mb-2">Generar apunts - Totes les assignatures</button>
                        <button id="compileAllCover" type="button" class="btn btn-primary w-100 mb-2">Generar tots els apunts junts, pdf final.</button>

                        <div class="d-flex flex-row justify-content-between px-2 mt-2">
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="ciutat" id="ciutat1" value="barcelona" checked>
                            <label class="form-check-label" for="exampleRadios1">Barcelona - Física</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="ciutat" id="ciutat2" value="terrassa" checked>
                            <label class="form-check-label" for="exampleRadios1">Terrassa - Aeros</label>
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`},
    
        modalNewFigure: `<div id="modalNewFigure" class="modal fade" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Nova figura</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="form-floating">
                            <input id="modalFigureNom" name="Nom" type="text" class="form-control" value="">
                            <label>Nom</label>
                        </div>
                        <button id="modalCreateFigureButton" class="btn btn-primary w-100 mt-2">Crear</button>
                    </div>
                </div>
            </div>
        </div>`
        
}