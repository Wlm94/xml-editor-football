/* Variables globales */
let xmlDoc = null;
let currentIndex = 0;
let searchResults = [];

/*Affichage du fichier XML*/
document.addEventListener("DOMContentLoaded", function () {
    fetch("Football-Clubs-Stats.xml")

        .then(response => response.text())
        .then(data => {
            const vue = document.querySelector(".fichier_xml");
            const parser = new DOMParser();
            xmlDoc = parser.parseFromString(data, "text/xml");
            vue.innerHTML = formatEditableXML(xmlDoc.documentElement, 0);
        })
});

/*Input modifiable*/
function formatEditableXML(node, level) {
    let indentation = "&nbsp;".repeat(level * 4);
    let sortie = `${indentation}&lt;${node.nodeName}&gt;<br>`;

    node.childNodes.forEach(child => {
        if (child.nodeType === 3) {
            const text = child.nodeValue.trim();
            if (text) {
                sortie += `${indentation}&nbsp;&nbsp;<input type="text" value="${escapeHtml(text)}" data-path="${getNodePath(child)}" class="xml-edit"><br>`;
            }
        } else if (child.nodeType === 1) {
            sortie += formatEditableXML(child, level + 1);
        }
    });
    sortie += `${indentation}&lt;/${node.nodeName}&gt;<br>`;
    return sortie;
}

/* Helper pour échapper le HTML */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* Génère un chemin unique pour chaque nœud */
function getNodePath(node) {
    const path = [];
    while (node.parentNode) {
        const siblings = Array.from(node.parentNode.childNodes).filter(n => n.nodeName === node.nodeName);
        const index = siblings.indexOf(node);
        path.unshift(`${node.nodeName}[${index}]`);
        node = node.parentNode;
    }
    return path.join('/');
}

/*Recherche d'un élément venant des inputs dans la barre de recherche*/
document.querySelector(".barre_recherche").addEventListener("input", function () {
    const terme_recherche = this.value.toLowerCase();
    searchResults = [];
    currentIndex = 0;

    if (terme_recherche.trim() === "") {
        document.getElementById("conteneur-resultats").innerHTML = "";
        return;
    }

    const allInputs = Array.from(document.querySelectorAll(".xml-edit"));
    allInputs.forEach((input, index) => {
        if (input.value.toLowerCase().includes(terme_recherche)) {
            searchResults.push(index);
        }
    });

    document.getElementById("conteneur-resultats").innerHTML = searchResults.length > 0 ? `${searchResults.length} résultat(s)` : "Aucun résultat trouvé";
    if (searchResults.length > 0) {
        scrollResultat(searchResults[currentIndex]);
    }
});

/*Navigation: Bouton Suivant et Précédent*/
document.querySelector("#bouton_suivant").addEventListener("click", function () {
    if (searchResults.length === 0) return;
    currentIndex = (currentIndex + 1) % searchResults.length;
    scrollResultat(searchResults[currentIndex]);
});

document.querySelector("#bouton_precedent").addEventListener("click", function () {
    if (searchResults.length === 0) return;
    currentIndex = (currentIndex - 1 + searchResults.length) % searchResults.length;
    scrollResultat(searchResults[currentIndex]);
});

/*Défilement direct vers l'élément ciblé et compteur de résultats*/
function scrollResultat(index) {
    const inputs = document.querySelectorAll(".xml-edit");
    if (inputs[index]) {
        inputs[index].scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
        document.getElementById("conteneur_resultats").innerHTML = `Résultat ${currentIndex + 1}/${searchResults.length}`;
    }
}

/*Sauvegarde des modifications renvoyés*/
document.querySelector("#bouton_sauvegarde").addEventListener("click", function () {
    document.querySelectorAll(".xml-edit").forEach(input => {
        const path = input.getAttribute('data-path').split('/');
        let node = xmlDoc;

        path.forEach(segment => {
            const match = segment.match(/(.+)\[(\d+)\]/);
            if (match) {
                const name = match[1];
                const index = parseInt(match[2]);
                node = Array.from(node.childNodes)
                    .filter(n => n.nodeName === name)[index];
            }
        });

        if (node) node.nodeValue = input.value;
    });

    const xmlString = new XMLSerializer().serializeToString(xmlDoc);

    fetch('save_xml.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: xmlString
    })
        .then(response => response.text())
        .then(message => alert(message))
});