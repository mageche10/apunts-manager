const contenido = document.getElementById('contenido');

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
})

async function cargarAssignatura(assignatura) {
    contenido.classList.add("fade-out")
    contenido.addEventListener("transitionend", async function handler() {
        contenido.removeEventListener("transitionend", handler)

        contenido.innerHTML = `
            <h1> ${assignatura.nom}</h1>
            <div id="cards-container" class="cards-container-custom"> </div>
        `
        const cardsContainer = document.getElementById("cards-container")

        temes = await window.api.getAllTemes(assignatura.abb)

        temes.forEach((tema) => {
            const card = createCardTema(tema, assignatura, document)
            cardsContainer.append(card)
        })

        const btnAdd = document.createElement("button")
        btnAdd.classList.add("btn", "btn-primary", "position-absolute", "btnTemaAdd")
        btnAdd.innerHTML = `<span class="material-symbols-outlined">add</span>`

        const index = temes.length + 1
        btnAdd.addEventListener('click', async () => newTema(assignatura))
        contenido.append(btnAdd)

        void contenido.offsetWidth
        contenido.classList.remove("fade-out")
        contenido.classList.add("fade-in")

        contenido.addEventListener("transitionend", function cleanup() {
            contenido.classList.remove("fade-in")
            contenido.removeEventListener("transitionend", cleanup)
        })
    })
}

function editarTema(index, subjectAbb){
    const result = window.api.editarTema(index, subjectAbb)
    if (!result) {
        const errorToast = document.getElementById("errorToast")
        document.getElementById("errorToastText").innerText = "Hi ha hagut un error al obrir VS Code."
        bootstrap.Toast.getOrCreateInstance(errorToast).show()
    }
}

async function verTema(index, subjectAbb){
    const div = document.getElementById(`verTemaDiv${index}`)
    div.innerHTML = `<div class="spinner-border spinner-border-sm" role="status"> <span class="sr-only"></span></div>`
    const result = await window.api.verTema(index, subjectAbb)

    if (!result) {
        document.getElementById("errorToastText").innerText = "Hi ha hagut un error al compilar l'arxiu."
        bootstrap.Toast.getOrCreateInstance(errorToast).show()
    } 
    div.innerHTML = `<span class="material-symbols-outlined">visibility</span>`
}

function borrarTema(index){
    mostrarModalConfirmar("Borrar tema", `Segur que vols borrar el Tema ${index}?`, () => {console.error("Feature is not yet implemented :(")}, "Eliminar")
}

function moreOptionsTema(){}

async function newTema(index, assignatura){
    window.api.newTema(index, subjectAbb)

    cargarAssignatura(assignatura)
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
        btn.addEventListener("click", () => { rel[0](tema.index, subject.abb) })
        btn.innerHTML = rel[1]
        options.appendChild(btn)
        elements.push(btn)
    })
    elements[3].classList.add("delete-card")

    card.appendChild(options)

    return card
}

async function cargarConfig(assignatures){

    const dataPath = await window.configApi.getDataPath()
    const VSEnvPath = await window.configApi.getVSEnvPath()
    contenido.innerHTML = `
        <h1>Configuración</h1>
        <div class=config-line>Editar assignatures <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalEditSubjects"> Editar </button> </div>
        <div class=config-line> <span id="dataPathLine">Ruta a la carpeta d'apunts: ${dataPath} </span><button id="dataDirectorySelector" type="button" class="btn btn-primary"> Cambiar </button></div>
        <div class=config-line> <span id="VSEnvPathLine">Ruta a la carpeta de l'entorn de VS Code: ${VSEnvPath} </span><button id="VSEnvDirectorySelector" type="button" class="btn btn-primary"> Cambiar </button></div>
    `

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
            const errorToast = document.getElementById("errorToast")
            document.getElementById("errorToastText").innerText = "No poden haver assignatures amb codis duplicats o buïts."
            bootstrap.Toast.getOrCreateInstance(errorToast).show()
        }
        
    })

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

function mostrarModalConfirmar(titol, cos, eventDanger, btnDangerText) {
    const modal = document.getElementById("modalConfirmarAbortar")
    document.getElementById("titleModalConfirmar").innerText = titol
    document.getElementById("bodyModalConfirmar").innerHTML = `<p>${cos}</p>`

    document.getElementById("btnDangerModalConfirmar").innerText = btnDangerText
    document.getElementById("btnDangerModalConfirmar").addEventListener('click', eventDanger())
    
    bootstrap.Modal.getOrCreateInstance(modal).show()
}
