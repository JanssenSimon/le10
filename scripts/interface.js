function whenDOMReady(callback, options = { once: true, passive: true }) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback, options);
  } else { callback(); }
}


// Holds references to interface elements.
const view = {
  nav: {
    tutorialLink: undefined,
    quitLink: undefined,
  },
  bidDialog: {
    container: undefined,
    closeButton: undefined
  },
  tutorialDialog: {
    container: undefined
  },
  quitDialog: {
    container: undefined,
    cancelButton: undefined,
    confirmButton: undefined
  },
  tableSelectDialog: {
    container: undefined
  }
}


whenDOMReady(() => {
  view.bidDialog.container = document.getElementById("bid");

  view.nav.tutorialLink = document.getElementById("nav-tutorial");
  view.tutorialDialog.container = document.getElementById("tutorial");
  view.tutorialDialog.closeButton = document.getElementById("tutorial-close");

  view.nav.quitLink = document.getElementById("nav-quit");
  view.quitDialog.container = document.getElementById("quit");
  view.quitDialog.cancelButton = document.getElementById("quit-cancel");
  view.quitDialog.confirmButton = document.getElementById("quit-confirm");
  view.tableSelectDialog.container = document.getElementById("table-select");


  view.nav.tutorialLink.addEventListener("click", () => {
    openModal(view.tutorialDialog.container);
  });

  view.tutorialDialog.closeButton.addEventListener("click", () => {
    closeModal(view.tutorialDialog.container);
  });

  view.nav.quitLink.addEventListener("click", () => {
    openModal(view.quitDialog.container);
  });

  view.quitDialog.cancelButton.addEventListener("click", () => {
    closeModal(view.quitDialog.container);
  });

  view.quitDialog.confirmButton.addEventListener("click", () => {
    closeModal(view.quitDialog.container);
    openModal(view.tableSelectDialog.container, true);
  });

});


/*
 * Wrapper for dialog.show().
 * Dialogs opened with this must use closeModal().
 * *el* is the dialog HTML element to be opened.
 * *trap* is whether to allow automatic exit methods (escape key and background click)
 */
function openModal(el, trap = false) {
  el.show();

  document.documentElement.classList.add("inert");

  if (!trap) {
    el.timeOpened = Date.now();
    el.abortCloseWithClick = new AbortController();
    document.addEventListener("click", e => {
      if (e.target !== el && !el.contains(e.target) &&
          Date.now() - 250 > el.timeOpened) {
        closeModal(el);
      }
    }, { signal: el.abortCloseWithClick.signal });

    el.abortCloseWithEscape = new AbortController();
    document.addEventListener("keydown", e => {
      if (e.code === "Escape") {
        closeModal(el)
        e.preventDefault();
      }
    }, { once: true, signal: el.abortCloseWithEscape.signal });
  }

}

/*
 * Wrapper for dialog.close().
 * *el* is the dialog HTML element to be closed.
 */
function closeModal(el) {
  el.abortCloseWithClick?.abort();
  el.abortCloseWithEscape?.abort();
  document.documentElement.classList.remove("inert");
  el.close();
}
