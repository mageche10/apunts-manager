import { cargarAssignatura } from './assignatures.js'
import { cargarConfig } from './config.js'
import { mostrarErrorToast } from './util.js'

window.addEventListener('DOMContentLoaded', async () => { 

    
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

    document.getElementById("configLink").addEventListener('click', () => {
        cargarConfig(assignatures)
    })

    const   links = document.querySelectorAll('.nav-link-custom')
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