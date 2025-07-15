export function mostrarErrorToast(text) {
    const errorToast = document.getElementById("errorToast")
    document.getElementById("errorToastText").innerText = text
    bootstrap.Toast.getOrCreateInstance(errorToast).show()
}

export function mostrarModalSeleccio(titol, cos, eventSi, btnConfirmText) {
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

export function mostrarModalConfirmar(titol, cos, eventDanger, btnDangerText) {
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

export function mostrarPrimaryToast(text){
    const primaryToast = document.getElementById("primaryToast")
    document.getElementById("primaryToastText").innerText = text
    bootstrap.Toast.getOrCreateInstance(primaryToast).show()
}
