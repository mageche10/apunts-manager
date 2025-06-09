const contenido = document.getElementById('contenido');

//Carrega de la funcionalitat de la barra de navegació
document.addEventListener('DOMContentLoaded', async () => {
    const assignatures = await window.api.getSubjectsData()

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
    contenido.innerHTML = `<h1> ${assignatura.nom}</h1>`
    temes = await window.api.getAllTemes(assignatura.abb)

    temes.forEach((tema) => {
        //Afegir cada card
    })
}

async function cargarConfig(assignatures){
    const dataPath = await window.api.getDataPath()
    contenido.innerHTML = `
        <h1>Configuración</h1>
        <div class=config-line>Editar assignatures <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalEditSubjects"> Editar </button> </div>
        <div class=config-line> <span id="dataPathLine">Ruta a la carpeta d'apunts: ${dataPath} </span><button id="dataDirectorySelector" type="button" class="btn btn-primary"> Cambiar </button></div>
    `

    document.getElementById('dataDirectorySelector').addEventListener('click', async () => {
        const path = await window.api.openDirectorySelector()
        if (path != null) {
            window.api.saveDataPath(path)
            document.getElementById("dataPathLine").innerText = `Ruta a la carpeta d'apunts: ${path}`
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
            const result = await window.api.saveSubjectsData(subjects)

            if (result) {
                bootstrap.Modal.getOrCreateInstance(editSubjectsModal).hide()
                location.reload();
                cargarConfig()
            } else {
                throw "No s'ha pogut guardar :("
            }

            
        } else {
            const errorToast = document.getElementById("duplicateSubjectToast")
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

