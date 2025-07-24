export function mostrarErrorToast(text) {
    const errorToast = document.getElementById("errorToast")
    document.getElementById("errorToastText").innerText = text
    bootstrap.Toast.getOrCreateInstance(errorToast).show()
}

export function mostrarModalSeleccio(titol, cos, eventConfirm, btnConfirmText, isDanger = false) {
    const modal = document.getElementById("modalSeleccio")
    document.getElementById("titleModalSeleccio").innerText = titol
    document.getElementById("bodyModalSeleccio").innerHTML = `<p>${cos}</p>`

    const btn = document.getElementById("btnSeleccioModalConfirmar");    
    btn.innerText = btnConfirmText
    btn.classList = isDanger ? "btn btn-danger" : "btn btn-primary"
    btn.removeEventListener('click', btn.onclick)

    btn.onclick = eventConfirm

    bootstrap.Modal.getOrCreateInstance(modal).show()
}

export function mostrarPrimaryToast(text){
    const primaryToast = document.getElementById("primaryToast")
    document.getElementById("primaryToastText").innerText = text
    bootstrap.Toast.getOrCreateInstance(primaryToast).show()
}
