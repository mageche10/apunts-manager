import { mostrarErrorToast, mostrarModalSeleccio, mostrarPrimaryToast } from "./util.js"

export async function carregarFigures(assignatura) {
    const subjectNavButtons = document.getElementsByClassName('subject-nav-button')
    Array.from(subjectNavButtons).forEach((button) => {
        button.classList.remove('active')
    })
    const figuresButton = document.getElementById('figuresButton')
    figuresButton.classList.add('active')

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
    cardsContainer.insertAdjacentHTML('beforeend', modalNewFigureHTML())
    btnNewFigure.addEventListener('click', async () => newFigure(assignatura))
    cardsContainer.append(btnNewFigure)
}

function deleteFigure(assignatura, figure) {
    mostrarModalSeleccio("Borrar Figura", `Segur que vols borrar la figura ${figure.name}?`, async () => {
        const result = await window.api.deleteFigure(figure, assignatura)

        if (result == false) {
            mostrarErrorToast("Error al borrar l'arxiu")
        } else {
            carregarFigures(assignatura)
        }
    }, "Eliminar", true)
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

window.rendererApi.newFigureShortcut(async () => {
    const currentSubject = window.currentSubject
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

            if (result == false) {
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

function modalNewFigureHTML() {
    return `<div id="modalNewFigure" class="modal fade" tabindex="-1">
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
        </div>` }