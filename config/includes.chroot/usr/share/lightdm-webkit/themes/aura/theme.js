// Talks to the real lightdm-webkit2-greeter JS bridge (window.lightdm).
// NOTE: this API has shifted slightly across greeter versions. If login
// doesn't trigger after `lb build`, check the version installed against
// /usr/share/doc/lightdm-webkit2-greeter*/ on your build machine and
// adjust the calls below — the shape (authenticate/respond/callbacks)
// has stayed stable, exact method names occasionally haven't.

const usernameEl = document.getElementById("username");
const helloEl = document.getElementById("hello");
const pinInput = document.getElementById("pin-input");
const errorEl = document.getElementById("error-msg");
const unlockBtn = document.getElementById("unlock-btn");
const clockEl = document.getElementById("clock");

let currentUser = null;

function tickClock() {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
setInterval(tickClock, 1000);
tickClock();

function startAuth() {
  const users = window.lightdm && window.lightdm.users ? window.lightdm.users : [];
  currentUser = users.length > 0 ? users[0].name : null;
  usernameEl.textContent = users.length > 0 ? (users[0].display_name || users[0].name) : "Local account";
  window.lightdm.authenticate(currentUser);
}

// --- Callbacks LightDM calls into this page ---

function show_prompt(text, promptType) {
  // promptType is "text" or "password" — we always show the same PIN/password field.
  errorEl.textContent = "";
  pinInput.value = "";
  pinInput.focus();
}

function show_message(text, messageType) {
  if (messageType === "error") {
    errorEl.textContent = text;
  }
}

function authentication_complete() {
  if (window.lightdm.is_authenticated) {
    const session = window.lightdm.default_session;
    window.lightdm.login(currentUser, session);
  } else {
    errorEl.textContent = "Incorrect PIN or password. Try again.";
    pinInput.value = "";
    startAuth();
  }
}

// --- UI wiring ---

function submitPin() {
  if (!pinInput.value) return;
  window.lightdm.respond(pinInput.value);
}

unlockBtn.addEventListener("click", submitPin);
pinInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitPin();
});

document.getElementById("restart-btn").addEventListener("click", () => {
  window.lightdm.restart();
});
document.getElementById("shutdown-btn").addEventListener("click", () => {
  window.lightdm.shutdown();
});

window.addEventListener("load", startAuth);
