import { carregarTemes } from './temes.js'
import { carregarFigures } from './figures.js'
import { mostrarErrorToast, mostrarModalSeleccio } from './util.js'


export async function cargarAssignatura(assignatura) {
    window.currentSubject = assignatura
    const contenido = document.getElementById('contenido');

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

        const temes = await window.api.getAllTemes(assignatura.abb)

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
            carregarTemes(assignatura)
        })
        figuresButton.addEventListener('click', () => {
            carregarFigures(assignatura)
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