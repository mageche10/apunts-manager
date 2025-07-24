import { mostrarErrorToast, mostrarModalSeleccio } from "./util.js"
import { cargarAssignatura } from "./assignatures.js"

export async function carregarTemes(assignatura) {
    const subjectNavButtons = document.getElementsByClassName('subject-nav-button')
    Array.from(subjectNavButtons).forEach((button) => {
        button.classList.remove('active')
    })
    const temesButton = document.getElementById('temesButton')
    temesButton.classList.add('active')

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
    cardsContainer.insertAdjacentHTML('beforeend', modalErratesHTML())
    cardsContainer.append(btnErratas)
    
    // Carregar botó de compilar tot i el seu modal
    const btnCompile = document.createElement("button")
    btnCompile.classList.add('btn', 'btn-primary', "position-absolute", "btnCompileAll", "floatingBtn")
    btnCompile.innerHTML = `<span class="material-symbols-outlined">menu_book</span>`
    cardsContainer.insertAdjacentHTML('beforeend', modalCompileAll(assignatura))
    btnCompile.addEventListener('click', () => showCompileAllModal(assignatura))
    cardsContainer.append(btnCompile)

    //Carregar botó de colors i el seu modal
    const btnColors = document.createElement("button")
    btnColors.classList.add('btn', 'btn-primary', "position-absolute", "btnColors", "floatingBtn")
    btnColors.innerHTML = `<span class="material-symbols-outlined">palette</span>`
    cardsContainer.insertAdjacentHTML('beforeend', modalColors())
    btnColors.addEventListener('click', () => showColorsModal(assignatura))
    cardsContainer.append(btnColors)

    // Carregar el botó de reordenament
    const btnReorder = document.createElement("button")
    btnReorder.classList.add('btn', 'btn-primary', "position-absolute", "btnReorder", "floatingBtn")
    btnReorder.innerHTML = `<span class="material-symbols-outlined">swap_vert</span>`
    cardsContainer.insertAdjacentHTML('beforeend', modalReorder())
    btnReorder.addEventListener('click', () => showReorderModal(temes, assignatura))
    cardsContainer.append(btnReorder)
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
    mostrarModalSeleccio("Borrar tema", `Segur que vols borrar el Tema ${index}?`, async () => {
        const result = await window.api.borrarTema(index, assignatura.abb)
        
        if(result == false) {
            mostrarErrorToast("Error al borrar l'arxiu")
        } else {
            cargarAssignatura(assignatura)
        }
    }, "Eliminar", true)
}

async function newTema(index, assignatura){
    const result = window.api.newTema(index, assignatura)

    if (result == false) {
        mostrarErrorToast("Error al crear un nou arxiu")
    } else {
        cargarAssignatura(assignatura)
    }
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
    elements[2].classList.add("delete-card")

    card.appendChild(options)

    return card
}

async function showErratasModal(assignatura) {
    const erratesModal = document.getElementById('modalErrates')
    const erratesModalBody = document.getElementById('modalBodyErrates')
    const modal = bootstrap.Modal.getOrCreateInstance(erratesModal)

    erratesModalBody.innerHTML = `<button id="addErrata" type="button" class="btn btn-primary w-100">Afegir errada</button>`
    const addErratabtn = document.getElementById('addErrata')

    const errates = await window.api.getErrates(assignatura.abb)
    errates.forEach(errada => {
        addErratabtn.insertAdjacentHTML('beforebegin', filaErrataHTML(errada.pag, errada.errada))
        document.querySelectorAll('.deleteErrata').forEach(e => {
            e.addEventListener('click', () => {
                e.parentNode.parentNode.remove()
            })
        })
    })

    addErratabtn.addEventListener('click', () => {
        addErratabtn.insertAdjacentHTML('beforebegin', filaErrataHTML(0, ""))
        document.querySelectorAll('.deleteErrata').forEach(e => {
            e.addEventListener('click', () => {
                e.parentNode.parentNode.remove()
            })
        })
    })

    document.getElementById("saveErratesBtn").onclick = async () => {
        console.log("hola")

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
                modal.hide()
            } else {
                mostrarErrorToast("No s'ha pogut guardar :(")
            }
        } else {
            mostrarErrorToast("No poden haver errates sense text descriptiu")
        }
    }

    modal.show()
}

function showCompileAllModal(assignatura) {
    const compileAllModal = document.getElementById('modalCompileAll')
    const body = document.getElementById('modalBodyCompileAll')
    const BSModal = bootstrap.Modal.getOrCreateInstance(compileAllModal)

    async function genericCompile (specificCompile) {
        document.getElementById("btnModalCompileClose").remove()

        const selectQuatri = document.getElementById('selectQuatri')
        const quatri = selectQuatri.options[selectQuatri.selectedIndex].text
        const ciutat = (selectQuatri.value - 1) % 4 < 2 ? "barcelona" : "terrassa"
        console.log(ciutat)

        body.innerHTML = `<div class="spinner-border" style="width: 4rem; height: 4rem;" role="status">
            <span class="sr-only"></span>
        </div>`
        body.classList.add('d-flex', 'justify-content-center', 'align-items-center')
        
        const result = await specificCompile(quatri, ciutat)

        if (result != true) {
            mostrarErrorToast(`No s'ha pogut generar el pdf: ${result}`)
        }

        compileAllModal.remove()
        BSModal.dispose()
        const cardsContainer = document.getElementById("cards-container")
        cardsContainer.insertAdjacentHTML('beforeend', modalCompileAll(assignatura))
    }

    document.getElementById('compileSubject').addEventListener('click', () => {
        genericCompile(async () => {
            return await window.api.generarApunts(assignatura, false)
        }) 
    })
    document.getElementById('compileSubjectCover').addEventListener('click', () => {
        genericCompile(async (quatri, ciutat) => {
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
        genericCompile(async (quatri, ciutat) => {
            return await window.api.generarApuntsAll(true, ciutat)
        })
    })

    BSModal.show()
}

async function showColorsModal(assignatura){
    const modal = document.getElementById('modalColors')
    const BSModal = bootstrap.Modal.getOrCreateInstance(modal)

    const selectColor = document.getElementById('selectColor')
    selectColor.innerHTML = `<option value="" selected disabled>Selecciona un color</option>`


    const colorMap = await window.configApi.getColorMap()
    colorMap.forEach((color) => {
        const option = document.createElement('option')
        option.value = color.name
        option.textContent = color.name
        selectColor.appendChild(option)
    })

    selectColor.addEventListener('change', () => {
        const selectedColor = colorMap.find(color => color.name === selectColor.value)

        const primaryDot = document.getElementById('colorPrimaryDot')
        const secondaryDot = document.getElementById('colorSecondaryDot')

        primaryDot.style.backgroundColor = `#${selectedColor.primary.toString(16)}`
        secondaryDot.style.backgroundColor = `#${selectedColor.secondary.toString(16)}`
    })

    const subjectColor = await window.api.getAssignaturaColors(assignatura.abb)
    const colorIndex = colorMap.findIndex(color => color.primary == subjectColor.primary)
    selectColor.selectedIndex = colorIndex + 1
    selectColor.dispatchEvent(new Event('change'))

    const saveColorsBtn = document.getElementById('saveColorsBtn')
    saveColorsBtn.onclick = () => {
        if (selectColor.selectedIndex != 0){

            const result = window.api.setSubjectColor(assignatura.abb, colorMap[selectColor.selectedIndex - 1])
            result ? BSModal.hide() : mostrarErrorToast("No s'ha pogut guardar")
        } else {
            mostrarErrorToast("Selecciona un color primer.")
        }
    }

    BSModal.show()
}

function showReorderModal(temes, assignatura) {
    const modal = document.getElementById('modalReorder')
    const BSModal = bootstrap.Modal.getOrCreateInstance(modal)

    const reorderList = document.getElementById('reorderList')
    reorderList.innerHTML = ''

    temes.forEach((tema) => {
        const listItem = document.createElement('li')
        listItem.classList.add('list-group-item')
        listItem.innerHTML = `${tema.index}. ${tema.name}`
        reorderList.appendChild(listItem)
    })

    Sortable.create(reorderList, {
        animation: 150,
    })

    document.getElementById('saveReorderBtn').onclick = async () => {
        const newOrder = Array.from(reorderList.children).map((item) => {
            return item.innerHTML.split('.')[0].trim()
        })

        const result = await window.api.reorderTemes(assignatura.abb, newOrder)

        if (result) {
            BSModal.hide()
            cargarAssignatura(assignatura)
        } else {
            mostrarErrorToast("No s'ha pogut reordenar els temes.")
        }
    }

    BSModal.show()
}

function modalErratesHTML() {
    return `<div id="modalErrates" class="modal fade modal-lg" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false" aria-labelledby="staticBackdropLabel" aria-hidden="true">
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
        </div>`}

function filaErrataHTML(pag, errata) {
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
}

function modalCompileAll(assignatura) {
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

                        <div class="mt-2 w-100">
                            <div class="form-floating">
                                <select class="form-select" id="selectQuatri">
                                    <option value="1">Primer Quadrimestre - Tardor 24-25</option>
                                    <option value="2">Segon Quadrimestre - Primavera 24-25</option>
                                    <option value="3">Tercer Quadrimestre - Tardor 25-26</option>
                                    <option value="4">Quart Quadrimestre - Primavera 25-26</option>
                                    <option value="5">Cinquè Quadrimestre - Tardor 26-27</option>
                                    <option value="6">Sisè Quadrimestre - Primavera 26-27</option>
                                    <option value="7">Setè Quadrimestre - Tardor 27-28</option>
                                    <option value="8">Vuitè Quadrimestre - Primavera 27-28</option>
                                </select>
                                <label for="selectQuatri">Quadrimestre</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`}

function modalColors() {
    return `<div id="modalColors" class="modal fade" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Colors d'assignatura</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="modalBodyCompileAll">
                        ATENCIÓ: de moment no está molt desenvolupat el tema dels colors. El primary i secundari (encara que no és del tot precisa la nomenclatura) és per les definicions. Els teoremes i lleis tenen color lila per defecte. Altres boxes que no s'utilitzen mai tenen altres colors hard-coded. S'hauria de fer alguna cosa.
                        
                        <div class="row mt-3">
                            <div class="col-8"><div class="form-floating">
                                <select class="form-select" id="selectColor">
                                    <option value="" selected disabled>Selecciona un color</option>
                                </select>
                                <label for="selectColor">Color principal</label>
                            </div></div>
                            <div class="col-2"><span id="colorPrimaryDot" style="width: 50px; height: 50px; background-color: transparent; display: inline-block; border-radius: 50%;"></span></div>
                            <div class="col-2"><span id="colorSecondaryDot" style="width: 50px; height: 50px; background-color: transparent; display: inline-block; border-radius: 50%;"></span></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Descartar</button>
                        <button type="button" class="btn btn-primary" id="saveColorsBtn">Guardar</button>
                    </div>
                </div>
            </div>
        </div>`
}

function modalReorder() {
    return `<div id="modalReorder" class="modal fade" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Reordenar Apunts</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="modalBodyReorder">
                        <p>Arrosega els temes per reordenar-los:</p>
                        <ul id="reorderList" class="list-group">
                            <!-- List items will be dynamically added here -->
                        </ul>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Descartar</button>
                        <button type="button" class="btn btn-primary" id="saveReorderBtn">Reordenar</button>
                    </div>
                </div>
            </div>
        </div>`
}