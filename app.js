const audio = document.querySelector("audio");
const audioCallback = undefined;
const chkAudio = document.getElementById("chkAudio");
const pCookies = document.getElementById("pCookies");
const pRate = document.getElementById("pRate");
const divUpgrades = document.getElementById("divUpgrades");

const upgradesUrl = "https://cookie-upgrade-api.vercel.app/api/upgrades";
const upgrades = [];
fetchUpgrades();

// Defaults: Brand new game, no cookies or upgrades, audio off
// TODO: What happens if user leaves, returns, we load prefs, audio is on but won't play
// TODO: as user hasn't interacted with us until the first time they click on the page?
const gameDefaults = new GameData(0, -1, false);

const savedData = JSON.parse(localStorage.getItem("cookieGameData"));
let gameData = savedData ? savedData : gameDefaults;
let cookieness = calcCookieness(gameData);
initElements(); // Set up remaining DOM elements
updateDisplay(); // Make display reflect the actual game state

const metronome = setInterval(() => {
  // It's an idling game, so we don't want cookies baking while the user's not here
  if (!document.hidden) gainCookies(cookieness);
}, 1000);

// #region FUNCTIONS (STORAGE AND SAVING)

// Note: Since this is triggered by the timer interval, it will get called and save
// the game every 1000ms, which is required by the assignment spec.
function saveGame() {
  localStorage.setItem("cookieGameData", JSON.stringify(gameData));
}

// #endregion

// #region FUNCTIONS (COOKIES AND UPGRADING)

// Works out just how cookie we are, measured by how many cookies we
// auto-bake per second. If our cookieness is high, we're getting lotsa cookies.
function calcCookieness(gameData) {
  let result = 0; // Without upgrades, no cookies unless you bake 'em yourself
  for (i = 0; i <= gameData.level; ++i) result += upgrades[i].increase;
  return result;
}

// Called whenever we're due any more cookies, to record this historic
// step forward for mankind and to handle the consequences
function gainCookies(howMany) {
  gameData.cookies += howMany;
  if (gameData.audio) startCrunch();
  updateDisplay();
  saveGame();
}

function updateDisplay() {
  pCookies.textContent = "Cookies: " + gameData.cookies;
  pRate.textContent = "Rate: " + cookieness;
  let i = 0;
  let colour;
  for (child in divUpgrades.children) {
    if (canBuyUpgrade(i)) colour = "black"; // Available
    else if (gameData.level < i) colour = "slategray"; // Not available yet
    else colour = "forestgreen"; // Purchased
    child.style.color = colour; // I know, this is really lazy styling :)
  }
  // TODO: And set whether we can click them?
}

// Determine whether we can currently buy the specified upgrade level.
// Note: We only allow the next level. We could be more flexible by remembering
// which upgrades have been purchased in the array.
function canBuyUpgrade(level) {
  console.log(level);
  const upg = upgrades[level];
  console.log(upg);
  console.log(upg.cost);
  let cost = upg["cost"];
  console.log(cost);
  return gameData.level + 1 == level && gameData.cookies >= upg.cost;
}

// Buy the next upgrade level
function buyUpgrade() {
  gameData.level++;
  gameData.cookies -= upgrades[gameData.level].cost;
  let cookieness = calcCookieness(gameData); // Recalculate
  updateDisplay();
  saveGame();
}

// #endregion

// #region FUNCTIONS (INITIALISATION)

// Add elements and listeners in the DOM before the game starts and set values
function initElements() {
  chkAudio.checked = gameData.audio;
  // We need the user to be able to restart the game so that they can experience
  // the excitement of purchasing low-level upgrades as many times as they want. And
  // since they won't know how to use dev tools, we'll need to give them a button!
  document.getElementById("btnReset").addEventListener("click", () => {
    // TODO: Ask user if they're sure
    gameData = gameDefaults;
    saveGame();
    showUpgrades();
    // TODO: Check if we need to reset any screen elements to defaults too
  });
  // Turn audio on/off when the user changes the checkbox
  chkAudio.addEventListener("change", (ev) => {
    gameData.audio = ev.currentTarget.checked;
    saveGame();
  });
}

async function fetchUpgrades() {
  // TODO: I'm sure failing to download a resource is pretty normal and maybe there's
  // TODO: ...a standard way of dealing with it, which I don't know yet. In the meantime
  // TODO: ...I've just displayed a message telling the user basically to come back later.
  try {
    const response = await fetch(upgradesUrl);
    // Convert any non-exception HTTP fail into an exception fail, so we only have to handle it once
    if (!response.ok) throw error("HTTP: " + response.status);
    const json = await response.json();
    let i = 0;
    for (let u of json) {
      let element = document.createElement("p");
      upgrades[i++] = new Upgrade(u.id, u.name, u.cost, u.increase, element);
      element.textContent = `${u.name} bakes ${u.increase}/sec and costs ${u.cost} cookies`;
      element.addEventListener("click", (ev) => {
        // If you click on a shop item while it's black (the colour that means it's
        // available to buy) then you buy it. Grim but I'm in a hurry and if it works...!
        if (ev.currentTarget.style.color === "black") buyUpgrade();
      });
      divUpgrades.appendChild(element);
    }
  } catch (err) {
    // TODO: Assumes the error is in the user's web connection, which it may well not be!
    alert(
      "Sorry, we couldn't load the game. Check your connection or refresh the page."
    );
  }
}

//To create multiple elements in a more convenient way, loops are your friend.
// create DOM elements to contain the upgrades data
// create an element
// assign the value to its text content
// append it to the DOM
// after you complete this task, you should see the upgrades on your website

// #endregion

// #region FUNCTIONS (AUDIO)

// Begins a cookie crunch sound, which will either stop by itself once the first crunch is
// done (my audio file then goes on for another 2 seconds, but I'm not using the rest) or
// alternatively may be interrupted by another crunch starting, if user clicks fast enough.
function startCrunch() {
  if (typeof audioCallback !== undefined) clearTimeout(audioCallback);
  audio.currentTime = 0; // TODO: WAS 50 wip
  audio.play(); // Now play 350ms of the crunch, unless interrupted first // TODO: WAS 400 WIP
  setTimeout(() => audio.play(), 0); // Now play 350ms of the crunch, unless interrupted first
  audioCallback = setTimeout(() => audio.pause(), 400);
}
// TODO: Disaster! Now prevents cookie counter from updating while audio is on, and no time to fix!
// TODO: Disaster! Change to audio means now it doesn't play priperly, no time tofix

// #endregion

// #region CONSTRUCTORS

function Upgrade(id, name, cost, increase, element) {
  this.id = id;
  this.name = name;
  this.cost = cost;
  this.increase = increase;
  this.element = element;
}

function GameData(cookies, level, audio) {
  this.cookies = cookies;
  this.level = level;
  this.audio = audio;
}

// #endregion
