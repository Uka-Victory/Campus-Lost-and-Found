import { auth, db, storage } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  addDoc,
  collection,
  getDocs,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-storage.js";

/* PAGE ELEMENTS */
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const lostItemForm = document.getElementById("lostItemForm");
const foundItemForm = document.getElementById("foundItemForm");
const claimForm = document.getElementById("claimForm");
const claimLostItemSelect = document.getElementById("claimLostItemId");
const claimFoundItemSelect = document.getElementById("claimFoundItemId");
const claimItemNameInput = document.getElementById("claimItemName");
const claimMatchMessage = document.getElementById("claimMatchMessage");
const settingsForm = document.getElementById("settingsForm");
const settingsPassportInput = document.getElementById("settingsPassport");
const settingsPassportPreview = document.getElementById("settingsPassportPreview");
const message = document.getElementById("message");
const logoutBtn = document.getElementById("logoutBtn");
const welcomeUser = document.getElementById("welcomeUser");

const lostItemsList = document.getElementById("lostItemsList");
const foundItemsList = document.getElementById("foundItemsList");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const searchBtn = document.getElementById("searchBtn");
const adminLostCount = document.getElementById("adminLostCount");
const adminFoundCount = document.getElementById("adminFoundCount");
const adminClaimsCount = document.getElementById("adminClaimsCount");
const adminMatchesCount = document.getElementById("adminMatchesCount");

const adminLostMeta = document.getElementById("adminLostMeta");
const adminFoundMeta = document.getElementById("adminFoundMeta");
const adminClaimsMeta = document.getElementById("adminClaimsMeta");
const adminMatchesMeta = document.getElementById("adminMatchesMeta");

const adminLostItemsList = document.getElementById("adminLostItemsList");
const adminResolvedLostItemsList = document.getElementById("adminResolvedLostItemsList");
const adminFoundItemsList = document.getElementById("adminFoundItemsList");
const adminResolvedFoundItemsList = document.getElementById("adminResolvedFoundItemsList");
const adminClaimsList = document.getElementById("adminClaimsList");
const adminReviewedClaimsList = document.getElementById("adminReviewedClaimsList");
const adminMatchesList = document.getElementById("adminMatchesList");

const myLostItemsList = document.getElementById("myLostItemsList");
const myFoundItemsList = document.getElementById("myFoundItemsList");
const myClaimsList = document.getElementById("myClaimsList");

const notificationsList = document.getElementById("notificationsList");

const profileMenuBtn = document.getElementById("profileMenuBtn");
const profileDropdown = document.getElementById("profileDropdown");

const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profilePhone = document.getElementById("profilePhone");
const profileFaculty = document.getElementById("profileFaculty");
const profileDepartment = document.getElementById("profileDepartment");
const profileLevel = document.getElementById("profileLevel");
const profileRole = document.getElementById("profileRole");

const themeLightBtn = document.getElementById("themeLightBtn");
const themeDarkBtn = document.getElementById("themeDarkBtn");
const themeAutoBtn = document.getElementById("themeAutoBtn");
const currentThemeLabel = document.getElementById("currentThemeLabel");

/* IMAGE INPUTS + PREVIEWS */
const passportInput = document.getElementById("passport");
const lostImageInput = document.getElementById("lostImage");
const foundImageInput = document.getElementById("foundImage");

const passportPreview = document.getElementById("passportPreview");
const lostImagePreview = document.getElementById("lostImagePreview");
const foundImagePreview = document.getElementById("foundImagePreview");

/* HELPERS */
async function uploadImage(file, folderName) {
  if (!file) return "";

  const fileRef = ref(storage, `${folderName}/${Date.now()}_${file.name}`);
  await uploadBytes(fileRef, file);
  const downloadURL = await getDownloadURL(fileRef);
  return downloadURL;
}

function showImagePreview(inputElement, previewElement) {
  if (!inputElement || !previewElement) return;

  inputElement.addEventListener("change", function () {
    const file = inputElement.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = function (e) {
        previewElement.src = e.target.result;
        previewElement.style.display = "block";
      };

      reader.readAsDataURL(file);
    } else {
      previewElement.src = "";
      previewElement.style.display = "none";
    }
  });
}

function getStatusBadge(status) {
  const safeStatus = (status || "open").toLowerCase();
  const label = safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1);
  return `<span class="status-badge status-${safeStatus}">${label}</span>`;
}

function showMsg(text) {
  if (message) message.textContent = text;
}

function showPopup(text) {
  alert(text);
}

const THEME_STORAGE_KEY = "campusLostFoundTheme";
const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

function getStoredThemeMode() {
  return localStorage.getItem(THEME_STORAGE_KEY) || "auto";
}

function resolveThemeMode(mode) {
  if (mode === "auto") {
    return systemThemeQuery.matches ? "dark" : "light";
  }
  return mode === "dark" ? "dark" : "light";
}

function updateThemeControls(mode) {
  if (themeLightBtn) themeLightBtn.classList.toggle("active", mode === "light");
  if (themeDarkBtn) themeDarkBtn.classList.toggle("active", mode === "dark");
  if (themeAutoBtn) themeAutoBtn.classList.toggle("active", mode === "auto");

  if (currentThemeLabel) {
    let label = "Auto";
    if (mode === "light") label = "Light";
    if (mode === "dark") label = "Dark";
    currentThemeLabel.textContent = `Current theme: ${label}`;
  }
}

function applyTheme(mode = getStoredThemeMode()) {
  const resolvedTheme = resolveThemeMode(mode);
  document.documentElement.setAttribute("data-theme", resolvedTheme);
  document.documentElement.setAttribute("data-theme-mode", mode);
  updateThemeControls(mode);
}

function saveThemeMode(mode) {
  localStorage.setItem(THEME_STORAGE_KEY, mode);
  applyTheme(mode);
}

function setupThemeControls() {
  if (themeLightBtn) {
    themeLightBtn.addEventListener("click", function () {
      saveThemeMode("light");
    });
  }

  if (themeDarkBtn) {
    themeDarkBtn.addEventListener("click", function () {
      saveThemeMode("dark");
    });
  }

  if (themeAutoBtn) {
    themeAutoBtn.addEventListener("click", function () {
      saveThemeMode("auto");
    });
  }

  updateThemeControls(getStoredThemeMode());
}

if (systemThemeQuery.addEventListener) {
  systemThemeQuery.addEventListener("change", function () {
    if (getStoredThemeMode() === "auto") {
      applyTheme("auto");
    }
  });
} else if (systemThemeQuery.addListener) {
  systemThemeQuery.addListener(function () {
    if (getStoredThemeMode() === "auto") {
      applyTheme("auto");
    }
  });
}

function normalizeText(value) {
  return (value || "").trim().toLowerCase();
}

function buildItemKey(itemName, category) {
  return `${normalizeText(itemName)}||${normalizeText(category)}`;
}

function buildOwnerItemKey(userId, itemName, category) {
  return `${userId || ""}||${buildItemKey(itemName, category)}`;
}

function tokenizeText(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function textSimilarity(a, b) {
  const tokensA = new Set(tokenizeText(a));
  const tokensB = new Set(tokenizeText(b));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let overlap = 0;
  tokensA.forEach((token) => {
    if (tokensB.has(token)) overlap += 1;
  });

  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : overlap / union;
}

function dateClosenessScore(dateA, dateB) {
  if (!dateA || !dateB) return 0;

  const first = new Date(dateA);
  const second = new Date(dateB);
  const diffMs = Math.abs(first.getTime() - second.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 2) return 10;
  if (diffDays <= 7) return 7;
  if (diffDays <= 14) return 4;
  if (diffDays <= 30) return 2;
  return 0;
}

function calculatePossibleMatch(lostItem, foundItem) {
  let score = 0;
  const reasons = [];

  if (
    normalizeText(lostItem.category) &&
    normalizeText(lostItem.category) === normalizeText(foundItem.category)
  ) {
    score += 25;
    reasons.push("same category");
  }

  const nameSimilarity = textSimilarity(lostItem.itemName, foundItem.itemName);
  if (nameSimilarity >= 0.75) {
    score += 25;
    reasons.push("very similar item name");
  } else if (nameSimilarity >= 0.4) {
    score += 14;
    reasons.push("similar item name");
  }

  const detailsSimilarity = textSimilarity(
    `${lostItem.description || ""} ${lostItem.uniqueMarks || ""}`,
    `${foundItem.description || ""} ${foundItem.uniqueMarks || ""} ${foundItem.privateNote || ""}`
  );
  if (detailsSimilarity >= 0.45) {
    score += 25;
    reasons.push("description/details overlap");
  } else if (detailsSimilarity >= 0.2) {
    score += 12;
    reasons.push("some description overlap");
  }

  const uniqueMarksSimilarity = textSimilarity(lostItem.uniqueMarks, foundItem.uniqueMarks);
  if (uniqueMarksSimilarity >= 0.35) {
    score += 15;
    reasons.push("unique marks overlap");
  } else if (uniqueMarksSimilarity > 0) {
    score += 8;
    reasons.push("some unique marks overlap");
  }

  const locationSimilarity = textSimilarity(lostItem.locationLost, foundItem.locationFound);
  if (locationSimilarity >= 0.5) {
    score += 10;
    reasons.push("similar location");
  } else if (locationSimilarity > 0) {
    score += 5;
    reasons.push("location overlap");
  }

  const dateScore = dateClosenessScore(lostItem.dateLost, foundItem.dateFound);
  if (dateScore > 0) {
    score += dateScore;
    reasons.push("dates are reasonably close");
  }

  return { score, reasons };
}

async function hasExistingMatchSuggestion(lostItemId, foundItemId) {
  const snapshot = await getDocs(collection(db, "matchSuggestions"));
  let exists = false;

  snapshot.forEach((docItem) => {
    const data = docItem.data();
    if (data.lostItemId === lostItemId && data.foundItemId === foundItemId) {
      exists = true;
    }
  });

  return exists;
}

async function createNotification(userId, title, text, type = "info", extraData = {}) {
  if (!userId) return;

  try {
    await addDoc(collection(db, "notifications"), {
      userId,
      title,
      text,
      type,
      createdAt: new Date().toISOString(),
      ...extraData
    });
  } catch (error) {
    console.log(error);
  }
}

async function createPossibleMatchSuggestion(lostItemId, lostItem, foundItemId, foundItem, matchData) {
  const alreadyExists = await hasExistingMatchSuggestion(lostItemId, foundItemId);
  if (alreadyExists) return;

  await addDoc(collection(db, "matchSuggestions"), {
    lostItemId,
    foundItemId,
    lostUserId: lostItem.userId,
    foundUserId: foundItem.userId,
    lostItemName: lostItem.itemName || "",
    foundItemName: foundItem.itemName || "",
    category: foundItem.category || lostItem.category || "",
    score: matchData.score,
    reasons: matchData.reasons,
    status: "suggested",
    createdAt: new Date().toISOString()
  });

  await createNotification(
    lostItem.userId,
    "Possible match found",
    `A found item report similar to "${lostItem.itemName}" was submitted. Review it and verify if it may be yours.`,
    "info",
    {
      notificationKind: "possible_match",
      lostItemId,
      foundItemId,
      matchScore: matchData.score
    }
  );
}

async function checkPossibleMatchesForFoundItem(foundItemId, foundItem) {
  const snapshot = await getDocs(collection(db, "lostItems"));

  for (const docItem of snapshot.docs) {
    const lostItem = docItem.data();
    const lostStatus = normalizeText(lostItem.status);

    if (lostStatus === "resolved") continue;
    if (lostItem.userId === foundItem.userId) continue;

    const matchData = calculatePossibleMatch(lostItem, foundItem);

    if (matchData.score >= 45) {
      await createPossibleMatchSuggestion(docItem.id, lostItem, foundItemId, foundItem, matchData);
    }
  }
}

async function checkPossibleMatchesForLostItem(lostItemId, lostItem) {
  const snapshot = await getDocs(collection(db, "foundItems"));

  for (const docItem of snapshot.docs) {
    const foundItem = docItem.data();
    const foundStatus = normalizeText(foundItem.status);

    if (foundStatus === "claimed" || foundStatus === "resolved") continue;
    if (foundItem.userId === lostItem.userId) continue;

    const matchData = calculatePossibleMatch(lostItem, foundItem);

    if (matchData.score >= 45) {
      await createPossibleMatchSuggestion(lostItemId, lostItem, docItem.id, foundItem, matchData);
    }
  }
}

function syncClaimItemName() {
  if (!claimFoundItemSelect || !claimItemNameInput) return;

  const selectedOption = claimFoundItemSelect.options[claimFoundItemSelect.selectedIndex];
  claimItemNameInput.value = selectedOption?.dataset?.itemName || "";
}

function resetClaimFoundItems() {
  if (claimFoundItemSelect) {
    claimFoundItemSelect.innerHTML = `<option value="">Select your lost report first</option>`;
  }

  if (claimItemNameInput) {
    claimItemNameInput.value = "";
  }

  if (claimMatchMessage) {
    claimMatchMessage.textContent = "";
  }
}

async function loadUserLostReports(userId) {
  if (!claimLostItemSelect) return;

  claimLostItemSelect.innerHTML = `<option value="">Loading your lost reports...</option>`;

  try {
    const snapshot = await getDocs(collection(db, "lostItems"));

    claimLostItemSelect.innerHTML = `<option value="">Select your lost report</option>`;

    let count = 0;

    snapshot.forEach((docItem) => {
      const item = docItem.data();
      const currentStatus = normalizeText(item.status);

      if (item.userId !== userId) return;
      if (currentStatus === "resolved") return;

      const option = document.createElement("option");
      option.value = docItem.id;
      option.dataset.itemName = item.itemName || "";
      option.dataset.category = item.category || "";
      option.textContent = `${item.itemName} • ${item.category} • ${item.dateLost || "No date"}`;
      claimLostItemSelect.appendChild(option);
      count += 1;
    });

    if (count === 0) {
      claimLostItemSelect.innerHTML = `<option value="">You have no open lost reports</option>`;
    }

    resetClaimFoundItems();
  } catch (error) {
    console.log(error);
    claimLostItemSelect.innerHTML = `<option value="">Failed to load your lost reports</option>`;
    resetClaimFoundItems();
  }
}

async function loadMatchedFoundItemsForLostReport(lostItemId, userId) {
  if (!claimFoundItemSelect) return;

  if (!lostItemId) {
    resetClaimFoundItems();
    return;
  }

  claimFoundItemSelect.innerHTML = `<option value="">Loading matching found reports...</option>`;

  try {
    const lostRef = doc(db, "lostItems", lostItemId);
    const lostSnap = await getDoc(lostRef);

    if (!lostSnap.exists()) {
      resetClaimFoundItems();
      return;
    }

    const lostItem = lostSnap.data();

    if (lostItem.userId !== userId) {
      resetClaimFoundItems();
      return;
    }

    const foundSnapshot = await getDocs(collection(db, "foundItems"));
    const matches = [];

    foundSnapshot.forEach((docItem) => {
      const foundItem = docItem.data();
      const foundStatus = normalizeText(foundItem.status);

      if (foundStatus === "claimed" || foundStatus === "resolved") return;
      if (foundItem.userId === userId) return;

      const matchData = calculatePossibleMatch(lostItem, foundItem);

      if (matchData.score >= 45) {
        matches.push({
          id: docItem.id,
          data: foundItem,
          score: matchData.score,
          reasons: matchData.reasons
        });
      }
    });

    matches.sort((a, b) => b.score - a.score);

    claimFoundItemSelect.innerHTML = `<option value="">Select a matching found-item report</option>`;

    if (matches.length === 0) {
      claimFoundItemSelect.innerHTML = `<option value="">No matching found reports available</option>`;
      if (claimMatchMessage) {
        claimMatchMessage.textContent = "No matching found reports were found for this lost report yet.";
      }
      syncClaimItemName();
      return;
    }

    matches.forEach((match) => {
      const option = document.createElement("option");
      option.value = match.id;
      option.dataset.itemName = match.data.itemName || "";
      option.dataset.category = match.data.category || "";
      option.dataset.score = String(match.score);
      option.textContent = `${match.data.itemName} • ${match.data.category} • score ${match.score}`;
      claimFoundItemSelect.appendChild(option);
    });

    if (claimMatchMessage) {
      claimMatchMessage.textContent = `${matches.length} matching found report(s) available for this lost report.`;
    }

    syncClaimItemName();
  } catch (error) {
    console.log(error);
    claimFoundItemSelect.innerHTML = `<option value="">Failed to load matching found reports</option>`;
    if (claimMatchMessage) {
      claimMatchMessage.textContent = "";
    }
  }
}

if (claimFoundItemSelect) {
  claimFoundItemSelect.addEventListener("change", syncClaimItemName);
}

if (claimLostItemSelect) {
  claimLostItemSelect.addEventListener("change", async function () {
    const user = auth.currentUser;
    if (!user) return;
    await loadMatchedFoundItemsForLostReport(claimLostItemSelect.value, user.uid);
  });
}

function setupProfileMenu() {
  if (!profileMenuBtn || !profileDropdown) return;

  profileMenuBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    profileDropdown.classList.toggle("show");
  });

  document.addEventListener("click", function (e) {
    if (!profileDropdown.contains(e.target) && e.target !== profileMenuBtn) {
      profileDropdown.classList.remove("show");
    }
  });
}

function setupImageModal() {
  let modal = document.getElementById("imageModal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "imageModal";
    modal.className = "image-modal";
    modal.innerHTML = `
      <button class="image-modal-close" id="imageModalClose">Close</button>
      <img id="imageModalImg" alt="Preview" />
    `;
    document.body.appendChild(modal);

    modal.addEventListener("click", function (e) {
      if (e.target === modal || e.target.id === "imageModalClose") {
        modal.style.display = "none";
      }
    });
  }

  const modalImg = document.getElementById("imageModalImg");

  document.querySelectorAll(".item-thumb").forEach((img) => {
    img.onclick = function () {
      modalImg.src = img.src;
      modal.style.display = "flex";
    };
  });
}

async function loadAdminOverview() {
  if (
    !adminLostCount &&
    !adminFoundCount &&
    !adminClaimsCount &&
    !adminMatchesCount &&
    !adminLostMeta &&
    !adminFoundMeta &&
    !adminClaimsMeta &&
    !adminMatchesMeta
  ) return;

  try {
    const [lostSnapshot, foundSnapshot, claimsSnapshot, matchesSnapshot] = await Promise.all([
      getDocs(collection(db, "lostItems")),
      getDocs(collection(db, "foundItems")),
      getDocs(collection(db, "claims")),
      getDocs(collection(db, "matchSuggestions"))
    ]);

    let activeLost = 0;
    let resolvedLost = 0;
    lostSnapshot.forEach((docItem) => {
      const status = normalizeText(docItem.data().status);
      if (status === "resolved") {
        resolvedLost += 1;
      } else {
        activeLost += 1;
      }
    });

    let activeFound = 0;
    let closedFound = 0;
    foundSnapshot.forEach((docItem) => {
      const status = normalizeText(docItem.data().status);
      if (status === "claimed" || status === "resolved") {
        closedFound += 1;
      } else {
        activeFound += 1;
      }
    });

    let pendingClaims = 0;
    let reviewedClaims = 0;
    claimsSnapshot.forEach((docItem) => {
      const item = docItem.data();
      const status = normalizeText(item.claimStatus);
      const hasLinkedFoundItem = !!item.foundItemId;

      if (status === "pending" && hasLinkedFoundItem) {
        pendingClaims += 1;
      } else {
        reviewedClaims += 1;
      }
    });

    let openMatches = 0;
    let archivedMatches = 0;
    matchesSnapshot.forEach((docItem) => {
      const status = normalizeText(docItem.data().status);
      if (!status || status === "suggested" || status === "open" || status === "pending") {
        openMatches += 1;
      } else {
        archivedMatches += 1;
      }
    });

    if (adminLostCount) adminLostCount.textContent = `${activeLost} active`;
    if (adminFoundCount) adminFoundCount.textContent = `${activeFound} active`;
    if (adminClaimsCount) adminClaimsCount.textContent = `${pendingClaims} pending`;
    if (adminMatchesCount) adminMatchesCount.textContent = `${openMatches} open`;

    if (adminLostMeta) adminLostMeta.textContent = `${resolvedLost} resolved`;
    if (adminFoundMeta) adminFoundMeta.textContent = `${closedFound} closed`;
    if (adminClaimsMeta) adminClaimsMeta.textContent = `${reviewedClaims} reviewed`;
    if (adminMatchesMeta) adminMatchesMeta.textContent = `${archivedMatches} archived`;
  } catch (error) {
    console.log(error);
  }
}

async function refreshVisiblePages() {
  const user = auth.currentUser;
  if (!user) return;

  if (lostItemsList && foundItemsList) {
    await loadItems();
  }

  if (adminLostCount || adminFoundCount || adminClaimsCount || adminMatchesCount) {
    await loadAdminOverview();
  }

  if (
    adminLostItemsList ||
    adminResolvedLostItemsList ||
    adminFoundItemsList ||
    adminResolvedFoundItemsList ||
    adminClaimsList ||
    adminReviewedClaimsList ||
    adminMatchesList
  ) {
    await loadAdminData();
  }

  if (myLostItemsList && myFoundItemsList && myClaimsList) {
    await loadMyReports(user.uid);
  }

  if (notificationsList) {
    await loadNotifications(user.uid);
  }
}

applyTheme(getStoredThemeMode());
showImagePreview(passportInput, passportPreview);
showImagePreview(lostImageInput, lostImagePreview);
showImagePreview(foundImageInput, foundImagePreview);
showImagePreview(settingsPassportInput, settingsPassportPreview);
setupProfileMenu();
setupThemeControls();

/* REGISTER */
if (registerForm) {
  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const submitBtn =
      registerForm.querySelector('button[type="submit"]') ||
      registerForm.querySelector("button");

    if (submitBtn?.disabled) return;

    showMsg("Registering...");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Registering...";
    }

    const matricNo = document.getElementById("matricNo").value.trim();
    const fullName = document.getElementById("fullName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const faculty = document.getElementById("faculty").value.trim();
    const department = document.getElementById("department").value.trim();
    const level = document.getElementById("level").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const passportFile = document.getElementById("passport")?.files[0] || null;

    if (!matricNo || !fullName || !phone || !email || !faculty || !department || !level || !password || !confirmPassword) {
      showMsg("Please fill in all required fields.");
      showPopup("Please fill in all required fields.");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Register";
      }
      return;
    }

    if (password !== confirmPassword) {
      showMsg("Passwords do not match.");
      showPopup("Passwords do not match.");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Register";
      }
      return;
    }

    let createdUser = null;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      createdUser = userCredential.user;

      await setDoc(doc(db, "users", createdUser.uid), {
        matricNo,
        fullName,
        phone,
        email,
        faculty,
        department,
        level,
        passportUrl: "",
        role: "student",
        createdAt: new Date().toISOString()
      });

      if (passportFile) {
        try {
          const passportUrl = await uploadImage(passportFile, "passports");
          await updateDoc(doc(db, "users", createdUser.uid), { passportUrl });
        } catch (passportError) {
          console.log("Passport upload failed:", passportError);
          showMsg("User registered successfully, but passport upload failed.");
          showPopup("User registered successfully, but passport upload failed. You can continue and update it later.");

          registerForm.reset();
          if (passportPreview) {
            passportPreview.src = "";
            passportPreview.style.display = "none";
          }

          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Register";
          }
          return;
        }
      }

      showMsg("Registration successful.");
      showPopup("User registered successfully.");
      registerForm.reset();

      if (passportPreview) {
        passportPreview.src = "";
        passportPreview.style.display = "none";
      }
    } catch (error) {
      console.log(error);

      if (createdUser) {
        try {
          await deleteUser(createdUser);
        } catch (cleanupError) {
          console.log("Cleanup failed:", cleanupError);
        }
      }

      let friendlyMessage = "Registration failed.";

      if (error.code === "auth/email-already-in-use") {
        friendlyMessage = "This user is already registered.";
      } else if (error.code === "auth/invalid-email") {
        friendlyMessage = "Please enter a valid email address.";
      } else if (error.code === "auth/weak-password") {
        friendlyMessage = "Password is too weak.";
      } else if (error.message) {
        friendlyMessage = error.message;
      }

      showMsg(friendlyMessage);
      showPopup(friendlyMessage);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Register";
      }
    }
  });
}

/* LOGIN + FORGOT PASSWORD */
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", async function (e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail")?.value.trim();

    if (!email) {
      showMsg("Enter your email address first.");
      showPopup("Enter your email address first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      showMsg("Password reset email sent.");
      showPopup("Password reset email sent. Check your email inbox.");
    } catch (error) {
      console.log(error);

      let friendlyMessage = "Failed to send password reset email.";

      if (error.code === "auth/invalid-email") {
        friendlyMessage = "Please enter a valid email address.";
      } else if (error.code === "auth/user-not-found") {
        friendlyMessage = "No account was found with that email address.";
      } else if (error.message) {
        friendlyMessage = error.message;
      }

      showMsg(friendlyMessage);
      showPopup(friendlyMessage);
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    showMsg("Logging in...");

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        showMsg("Your account exists in Authentication, but your profile is missing from the database. Contact admin or register again after the orphan account is removed.");
        await signOut(auth);
        return;
      }

      const userData = userSnap.data();
      const role = userData.role || "student";
      const passportUrl = (userData.passportUrl || "").trim();
      const normalizedRole = (role || "").trim().toLowerCase();

      showMsg("Login successful.");

if (normalizedRole === "admin") {
  window.location.href = "./admin.html";
} else {
  window.location.href = "./dashboard.html";
}
    } catch (error) {
      showMsg(error.message);
      console.log(error);
    }
  });
}

/* LOGOUT */
if (logoutBtn) {
  logoutBtn.addEventListener("click", async function (e) {
    e.preventDefault();

    try {
      await signOut(auth);
      window.location.href = "./index.html";
    } catch (error) {
      console.log(error);
      alert("Logout failed.");
    }
  });
}

/* SETTINGS */
async function loadSettings(user) {
  if (!settingsForm) return;

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    const data = userSnap.data();

    document.getElementById("settingsFullName").value = data.fullName || "";
    document.getElementById("settingsPhone").value = data.phone || "";
    document.getElementById("settingsEmail").value = data.email || user.email || "";
    document.getElementById("settingsFaculty").value = data.faculty || "";
    document.getElementById("settingsDepartment").value = data.department || "";
    document.getElementById("settingsLevel").value = data.level || "";
  } catch (error) {
    console.log(error);
  }
}

async function loadProfile(user) {
  if (!profileName) return;

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    const data = userSnap.data();

    profileName.textContent = data.fullName || "User";
    if (profileEmail) profileEmail.textContent = data.email || user.email || "-";
    if (profilePhone) profilePhone.textContent = data.phone || "-";
    if (profileFaculty) profileFaculty.textContent = data.faculty || "-";
    if (profileDepartment) profileDepartment.textContent = data.department || "-";
    if (profileLevel) profileLevel.textContent = data.level || "-";
    if (profileRole) profileRole.textContent = data.role || "student";
  } catch (error) {
    console.log(error);
  }
}

if (settingsForm) {
  settingsForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      showMsg("Please log in first.");
      return;
    }

    showMsg("Saving changes...");

    const fullName = document.getElementById("settingsFullName").value.trim();
    const phone = document.getElementById("settingsPhone").value.trim();
    const email = document.getElementById("settingsEmail").value.trim();
    const faculty = document.getElementById("settingsFaculty").value.trim();
    const department = document.getElementById("settingsDepartment").value.trim();
    const level = document.getElementById("settingsLevel").value.trim();
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmNewPassword = document.getElementById("confirmNewPassword").value;
    const settingsPassportFile = settingsPassportInput?.files[0] || null;

    try {
      const userRef = doc(db, "users", user.uid);
      const emailChanged = user.email !== email;
      const wantsPasswordChange = newPassword.trim() !== "";

      if (wantsPasswordChange && newPassword !== confirmNewPassword) {
        showMsg("New passwords do not match.");
        return;
      }

      if ((emailChanged || wantsPasswordChange) && !currentPassword) {
        showMsg("Enter your current password to change email or password.");
        return;
      }

      if (emailChanged || wantsPasswordChange) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
      }

      if (emailChanged) {
        await updateEmail(user, email);
      }

      if (wantsPasswordChange) {
        await updatePassword(user, newPassword);
      }

      await updateDoc(userRef, {
  fullName,
  phone,
  email,
  faculty,
  department,
  level
});

let settingsMessage = "Settings updated successfully.";

if (settingsPassportFile) {
  try {
    const passportUrl = await uploadImage(settingsPassportFile, "passports");
    if (passportUrl) {
      await updateDoc(userRef, { passportUrl });
    }
  } catch (passportError) {
    console.log("Settings passport upload failed:", passportError);
    settingsMessage = "Settings updated successfully, but passport upload failed. You can update it later.";
  }
}

showMsg(settingsMessage);
showPopup(settingsMessage);

      document.getElementById("currentPassword").value = "";
      document.getElementById("newPassword").value = "";
      document.getElementById("confirmNewPassword").value = "";
      if (settingsPassportInput) settingsPassportInput.value = "";

      if (settingsPassportPreview) {
        settingsPassportPreview.src = "";
        settingsPassportPreview.style.display = "none";
      }

      await loadSettings(user);
    } catch (error) {
      showMsg(error.message);
      console.log(error);
    }
  });
}

/* LOST ITEM */
if (lostItemForm) {
  lostItemForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    showMsg("Submitting lost item report...");

    const user = auth.currentUser;
    if (!user) {
      showMsg("Please log in first.");
      return;
    }

    const itemName = document.getElementById("itemName").value.trim();
    const category = document.getElementById("category").value;
    const description = document.getElementById("description").value.trim();
    const uniqueMarks = document.getElementById("lostUniqueMarks").value.trim();
    const dateLost = document.getElementById("dateLost").value;
    const locationLost = document.getElementById("locationLost").value.trim();
    const lostImageFile = document.getElementById("lostImage")?.files[0] || null;

    try {
      let lostImageUrl = "";
let lostSubmitMessage = "Lost item report submitted successfully.";

if (lostImageFile) {
  try {
    lostImageUrl = await uploadImage(lostImageFile, "lost-items");
  } catch (imageError) {
    console.log("Lost item image upload failed:", imageError);
    lostSubmitMessage = "Lost item report submitted successfully, but image upload failed.";
  }
}

const newLostRef = await addDoc(collection(db, "lostItems"), {
  userId: user.uid,
  itemName,
  category,
  description,
  uniqueMarks,
  dateLost,
  locationLost,
  imageUrl: lostImageUrl,
  status: "open",
  createdAt: new Date().toISOString()
});

await checkPossibleMatchesForLostItem(newLostRef.id, {
  userId: user.uid,
  itemName,
  category,
  description,
  uniqueMarks,
  dateLost,
  locationLost,
  imageUrl: lostImageUrl,
  status: "open"
});

showMsg(lostSubmitMessage);
showPopup(lostSubmitMessage);
      lostItemForm.reset();

      if (lostImagePreview) {
        lostImagePreview.src = "";
        lostImagePreview.style.display = "none";
      }
    } catch (error) {
      showMsg(error.message);
      console.log(error);
    }
  });
}

/* FOUND ITEM */
if (foundItemForm) {
  foundItemForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    showMsg("Submitting found item report...");

    const user = auth.currentUser;
    if (!user) {
      showMsg("Please log in first.");
      return;
    }

    const foundItemName = document.getElementById("foundItemName").value.trim();
    const foundCategory = document.getElementById("foundCategory").value;
    const foundDescription = document.getElementById("foundDescription").value.trim();
    const foundUniqueMarks = document.getElementById("foundUniqueMarks").value.trim();
    const dateFound = document.getElementById("dateFound").value;
    const locationFound = document.getElementById("locationFound").value.trim();
    const handInLocation = document.getElementById("handInLocation").value.trim();
    const privateNote = document.getElementById("privateNote").value.trim();
    const foundImageFile = document.getElementById("foundImage")?.files[0] || null;

    try {
      let foundImageUrl = "";
let foundSubmitMessage = "Found item report submitted successfully.";

if (foundImageFile) {
  try {
    foundImageUrl = await uploadImage(foundImageFile, "found-items");
  } catch (imageError) {
    console.log("Found item image upload failed:", imageError);
    foundSubmitMessage = "Found item report submitted successfully, but image upload failed.";
  }
}

const newFoundRef = await addDoc(collection(db, "foundItems"), {
  userId: user.uid,
  itemName: foundItemName,
  category: foundCategory,
  description: foundDescription,
  uniqueMarks: foundUniqueMarks,
  dateFound,
  locationFound,
  handInLocation,
  privateNote,
  imageUrl: foundImageUrl,
  status: "open",
  createdAt: new Date().toISOString()
});

await checkPossibleMatchesForFoundItem(newFoundRef.id, {
  userId: user.uid,
  itemName: foundItemName,
  category: foundCategory,
  description: foundDescription,
  uniqueMarks: foundUniqueMarks,
  dateFound,
  locationFound,
  handInLocation,
  privateNote,
  status: "open"
});

showMsg(foundSubmitMessage);
showPopup(foundSubmitMessage);
      foundItemForm.reset();

      if (foundImagePreview) {
        foundImagePreview.src = "";
        foundImagePreview.style.display = "none";
      }
    } catch (error) {
      showMsg(error.message);
      console.log(error);
    }
  });
}

/* CLAIM ITEM */
if (claimForm) {
  claimForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    showMsg("Submitting claim...");

    const user = auth.currentUser;
    if (!user) {
      showMsg("Please log in first.");
      return;
    }

    const selectedLostItemId = claimLostItemSelect?.value || "";
    const selectedFoundItemId = claimFoundItemSelect?.value || "";
    const claimReason = document.getElementById("claimReason").value.trim();
    const claimDescription = document.getElementById("claimDescription").value.trim();
    const claimUniqueMarks = document.getElementById("claimUniqueMarks").value.trim();
    const claimContents = document.getElementById("claimContents").value.trim();
    const claimLostPlace = document.getElementById("claimLostPlace").value.trim();
    const claimLostDate = document.getElementById("claimLostDate").value;

    if (!selectedLostItemId) {
      showMsg("Select your lost report first.");
      showPopup("Select your lost report first.");
      return;
    }

    if (!selectedFoundItemId) {
      showMsg("Select a matching found-item report.");
      showPopup("Select a matching found-item report.");
      return;
    }

    try {
      const lostRef = doc(db, "lostItems", selectedLostItemId);
      const foundRef = doc(db, "foundItems", selectedFoundItemId);

      const [lostSnap, foundSnap] = await Promise.all([getDoc(lostRef), getDoc(foundRef)]);

      if (!lostSnap.exists()) {
        showMsg("The selected lost report no longer exists.");
        showPopup("The selected lost report no longer exists.");
        await loadUserLostReports(user.uid);
        return;
      }

      if (!foundSnap.exists()) {
        showMsg("The selected found-item report no longer exists.");
        showPopup("The selected found-item report no longer exists.");
        await loadMatchedFoundItemsForLostReport(selectedLostItemId, user.uid);
        return;
      }

      const lostData = lostSnap.data();
      const foundData = foundSnap.data();

      if (lostData.userId !== user.uid) {
        showMsg("You can only claim using your own lost report.");
        showPopup("You can only claim using your own lost report.");
        return;
      }

      if (normalizeText(lostData.status) === "resolved") {
        showMsg("This lost report is already resolved.");
        showPopup("This lost report is already resolved.");
        return;
      }

      if (normalizeText(foundData.status) === "claimed" || normalizeText(foundData.status) === "resolved") {
        showMsg("This found item has already been claimed.");
        showPopup("This found item has already been claimed.");
        await loadMatchedFoundItemsForLostReport(selectedLostItemId, user.uid);
        return;
      }

      if (foundData.userId === user.uid) {
        showMsg("You reported this found item yourself. You do not need to file a claim for it.");
        showPopup("You reported this found item yourself. You do not need to file a claim for it.");
        return;
      }

      const matchData = calculatePossibleMatch(lostData, foundData);
      if (matchData.score < 45) {
        showMsg("This found report is not a close enough match for the selected lost report.");
        showPopup("This found report is not a close enough match for the selected lost report.");
        return;
      }

      const existingClaimsSnapshot = await getDocs(collection(db, "claims"));
      let alreadyClaimedByUser = false;

      existingClaimsSnapshot.forEach((docItem) => {
        const existingClaim = docItem.data();
        if (
          existingClaim.userId === user.uid &&
          existingClaim.lostItemId === selectedLostItemId &&
          existingClaim.foundItemId === selectedFoundItemId &&
          normalizeText(existingClaim.claimStatus) !== "rejected"
        ) {
          alreadyClaimedByUser = true;
        }
      });

      if (alreadyClaimedByUser) {
        showMsg("You already submitted a claim for this matched pair.");
        showPopup("You already submitted a claim for this matched pair.");
        return;
      }

      const itemName = foundData.itemName || lostData.itemName || "";
      const category = foundData.category || lostData.category || "";
      const foundItemLabel = `${foundData.itemName || ""} • ${foundData.category || ""} • ${foundData.handInLocation || "No hand-in location"}`;
      const lostItemLabel = `${lostData.itemName || ""} • ${lostData.category || ""} • ${lostData.dateLost || "No date"}`;

      await addDoc(collection(db, "claims"), {
        userId: user.uid,
        lostItemId: selectedLostItemId,
        lostItemOwnerId: lostData.userId || "",
        lostItemLabel,
        foundItemId: selectedFoundItemId,
        foundItemOwnerId: foundData.userId || "",
        foundItemLabel,
        itemName,
        category,
        reason: claimReason,
        description: claimDescription,
        uniqueMarks: claimUniqueMarks,
        contents: claimContents,
        lostPlace: claimLostPlace,
        lostDate: claimLostDate,
        matchScore: matchData.score,
        claimStatus: "pending",
        createdAt: new Date().toISOString()
      });

      showMsg("Claim submitted successfully.");
      showPopup("Claim submitted successfully.");
      claimForm.reset();

      if (claimMatchMessage) {
        claimMatchMessage.textContent = "";
      }

      await loadUserLostReports(user.uid);
      resetClaimFoundItems();
    } catch (error) {
      showMsg(error.message);
      console.log(error);
    }
  });
}

/* BROWSE ITEMS */
async function loadItems() {
  if (!lostItemsList || !foundItemsList) return;

  lostItemsList.innerHTML = "Loading lost items...";
  foundItemsList.innerHTML = "Loading found items...";

  const searchText = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const selectedCategory = categoryFilter ? categoryFilter.value.trim().toLowerCase() : "";

  try {
    const lostSnapshot = await getDocs(collection(db, "lostItems"));
    const foundSnapshot = await getDocs(collection(db, "foundItems"));

    lostItemsList.innerHTML = "";
    foundItemsList.innerHTML = "";

    lostSnapshot.forEach((docItem) => {
      const item = docItem.data();
      const currentStatus = normalizeText(item.status);

      if (currentStatus === "resolved") return;

      const itemName = (item.itemName || "").toLowerCase();
      const category = (item.category || "").toLowerCase();
      const matchesSearch = !searchText || itemName.includes(searchText) || category.includes(searchText);
      const matchesCategory = !selectedCategory || category === selectedCategory;

      if (!matchesSearch || !matchesCategory) return;

      lostItemsList.innerHTML += `
        <div class="items-box">
          <h3>${item.itemName}</h3>
          <p><strong>Category:</strong> ${item.category}</p>
          <p><strong>Description:</strong> ${item.description}</p>
          <p><strong>Date Lost:</strong> ${item.dateLost}</p>
          <p><strong>Location Lost:</strong> ${item.locationLost}</p>
          <p><strong>Status:</strong> ${getStatusBadge(item.status)}</p>
          ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.itemName}" class="item-thumb" />` : ""}
        </div>
      `;
    });

    foundSnapshot.forEach((docItem) => {
      const item = docItem.data();
      const currentStatus = normalizeText(item.status);

      if (currentStatus === "claimed" || currentStatus === "resolved") return;

      const itemName = (item.itemName || "").toLowerCase();
      const category = (item.category || "").toLowerCase();
      const matchesSearch = !searchText || itemName.includes(searchText) || category.includes(searchText);
      const matchesCategory = !selectedCategory || category === selectedCategory;

      if (!matchesSearch || !matchesCategory) return;

      foundItemsList.innerHTML += `
        <div class="items-box">
          <h3>${item.itemName}</h3>
          <p><strong>Category:</strong> ${item.category}</p>
          <p><strong>Description:</strong> ${item.description}</p>
          <p><strong>Date Found:</strong> ${item.dateFound}</p>
          <p><strong>Location Found:</strong> ${item.locationFound}</p>
          <p><strong>Handed In At:</strong> ${item.handInLocation}</p>
          <p><strong>Status:</strong> ${getStatusBadge(item.status)}</p>
          ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.itemName}" class="item-thumb" />` : ""}
        </div>
      `;
    });

    if (lostItemsList.innerHTML === "") {
      lostItemsList.innerHTML = "<p>No lost items found.</p>";
    }

    if (foundItemsList.innerHTML === "") {
      foundItemsList.innerHTML = "<p>No found items found.</p>";
    }

    setupImageModal();
  } catch (error) {
    lostItemsList.innerHTML = "<p>Failed to load lost items.</p>";
    foundItemsList.innerHTML = "<p>Failed to load found items.</p>";
    console.log(error);
  }
}

if (lostItemsList && foundItemsList) {
  loadItems();
}

if (searchBtn) searchBtn.addEventListener("click", loadItems);
if (categoryFilter) categoryFilter.addEventListener("change", loadItems);
if (searchInput) searchInput.addEventListener("input", loadItems);

/* MY REPORTS */
async function loadMyReports(userId) {
  if (!myLostItemsList || !myFoundItemsList || !myClaimsList) return;

  myLostItemsList.innerHTML = "Loading your lost item reports...";
  myFoundItemsList.innerHTML = "Loading your found item reports...";
  myClaimsList.innerHTML = "Loading your claims...";

  try {
    const lostSnapshot = await getDocs(collection(db, "lostItems"));
    const foundSnapshot = await getDocs(collection(db, "foundItems"));
    const claimsSnapshot = await getDocs(collection(db, "claims"));

    myLostItemsList.innerHTML = "";
    myFoundItemsList.innerHTML = "";
    myClaimsList.innerHTML = "";

    lostSnapshot.forEach((docItem) => {
      const item = docItem.data();
      if (item.userId !== userId) return;

      myLostItemsList.innerHTML += `
        <div class="items-box">
          <h3>${item.itemName}</h3>
          <p><strong>Category:</strong> ${item.category}</p>
          <p><strong>Description:</strong> ${item.description}</p>
          <p><strong>Date Lost:</strong> ${item.dateLost}</p>
          <p><strong>Location Lost:</strong> ${item.locationLost}</p>
          <p><strong>Status:</strong> ${getStatusBadge(item.status)}</p>
          ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.itemName}" class="item-thumb" />` : ""}
          <div class="action-row">
            <button onclick="window.editLostReport('${docItem.id}')">Edit</button>
            <button onclick="window.deleteLostReport('${docItem.id}')">Delete</button>
          </div>
        </div>
      `;
    });

    foundSnapshot.forEach((docItem) => {
      const item = docItem.data();
      if (item.userId !== userId) return;

      myFoundItemsList.innerHTML += `
        <div class="items-box">
          <h3>${item.itemName}</h3>
          <p><strong>Category:</strong> ${item.category}</p>
          <p><strong>Description:</strong> ${item.description}</p>
          <p><strong>Date Found:</strong> ${item.dateFound}</p>
          <p><strong>Location Found:</strong> ${item.locationFound}</p>
          <p><strong>Handed In At:</strong> ${item.handInLocation}</p>
          <p><strong>Status:</strong> ${getStatusBadge(item.status)}</p>
          ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.itemName}" class="item-thumb" />` : ""}
          <div class="action-row">
            <button onclick="window.editFoundReport('${docItem.id}')">Edit</button>
            <button onclick="window.deleteFoundReport('${docItem.id}')">Delete</button>
          </div>
        </div>
      `;
    });

    claimsSnapshot.forEach((docItem) => {
      const item = docItem.data();
      if (item.userId !== userId) return;

      myClaimsList.innerHTML += `
        <div class="items-box">
          <h3>${item.itemName}</h3>
          <p><strong>Reason:</strong> ${item.reason}</p>
          <p><strong>Description:</strong> ${item.description}</p>
          <p><strong>Unique Marks:</strong> ${item.uniqueMarks}</p>
          <p><strong>Contents:</strong> ${item.contents}</p>
          <p><strong>Lost Place:</strong> ${item.lostPlace}</p>
          <p><strong>Lost Date:</strong> ${item.lostDate}</p>
          <p><strong>Status:</strong> ${getStatusBadge(item.claimStatus)}</p>
          <div class="action-row">
            <button onclick="window.editClaimReport('${docItem.id}')">Edit</button>
            <button onclick="window.deleteClaimReport('${docItem.id}')">Delete</button>
          </div>
        </div>
      `;
    });

    if (myLostItemsList.innerHTML === "") myLostItemsList.innerHTML = "<p>You have no lost item reports yet.</p>";
    if (myFoundItemsList.innerHTML === "") myFoundItemsList.innerHTML = "<p>You have no found item reports yet.</p>";
    if (myClaimsList.innerHTML === "") myClaimsList.innerHTML = "<p>You have no claims yet.</p>";

    setupImageModal();
  } catch (error) {
    myLostItemsList.innerHTML = "<p>Failed to load your lost item reports.</p>";
    myFoundItemsList.innerHTML = "<p>Failed to load your found item reports.</p>";
    myClaimsList.innerHTML = "<p>Failed to load your claims.</p>";
    console.log(error);
  }
}

window.editLostReport = async function (reportId) {
  const reportRef = doc(db, "lostItems", reportId);
  const snap = await getDoc(reportRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const newDescription = prompt("Edit description:", data.description || "");
  if (newDescription === null) return;
  const newLocation = prompt("Edit lost location:", data.locationLost || "");
  if (newLocation === null) return;

  await updateDoc(reportRef, {
    description: newDescription.trim(),
    locationLost: newLocation.trim()
  });

  await refreshVisiblePages();
};

window.deleteLostReport = async function (reportId) {
  if (!confirm("Delete this lost item report?")) return;
  await deleteDoc(doc(db, "lostItems", reportId));
  await refreshVisiblePages();
};

window.editFoundReport = async function (reportId) {
  const reportRef = doc(db, "foundItems", reportId);
  const snap = await getDoc(reportRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const newDescription = prompt("Edit description:", data.description || "");
  if (newDescription === null) return;
  const newHandIn = prompt("Edit hand-in location:", data.handInLocation || "");
  if (newHandIn === null) return;

  await updateDoc(reportRef, {
    description: newDescription.trim(),
    handInLocation: newHandIn.trim()
  });

  await refreshVisiblePages();
};

window.deleteFoundReport = async function (reportId) {
  if (!confirm("Delete this found item report?")) return;
  await deleteDoc(doc(db, "foundItems", reportId));
  await refreshVisiblePages();
};

window.editClaimReport = async function (reportId) {
  const reportRef = doc(db, "claims", reportId);
  const snap = await getDoc(reportRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const newReason = prompt("Edit reason:", data.reason || "");
  if (newReason === null) return;
  const newDescription = prompt("Edit description:", data.description || "");
  if (newDescription === null) return;

  await updateDoc(reportRef, {
    reason: newReason.trim(),
    description: newDescription.trim()
  });

  await refreshVisiblePages();
};

window.deleteClaimReport = async function (reportId) {
  if (!confirm("Delete this claim?")) return;
  await deleteDoc(doc(db, "claims", reportId));
  await refreshVisiblePages();
};

/* NOTIFICATIONS */
async function loadNotifications(userId) {
  if (!notificationsList) return;

  notificationsList.innerHTML = "Loading notifications...";

  try {
    const snapshot = await getDocs(collection(db, "notifications"));
    let items = [];

    snapshot.forEach((docItem) => {
      const data = docItem.data();
      if (data.userId === userId) {
        items.push(data);
      }
    });

    items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    notificationsList.innerHTML = "";

    if (items.length === 0) {
      notificationsList.innerHTML = "<p>No notifications yet.</p>";
      return;
    }

    items.slice(0, 10).forEach((item) => {
      notificationsList.innerHTML += `
        <div class="notification-item notification-${item.type || "info"}">
          <p><strong>${item.title}</strong></p>
          <p>${item.text}</p>
        </div>
      `;
    });
  } catch (error) {
    notificationsList.innerHTML = "<p>Failed to load notifications.</p>";
    console.log(error);
  }
}

/* ADMIN */
async function updateClaimStatus(claimId, status) {
  try {
    const claimRef = doc(db, "claims", claimId);
    const claimSnap = await getDoc(claimRef);

    if (claimSnap.exists()) {
      const claimData = claimSnap.data();

      await updateDoc(claimRef, {
        claimStatus: status
      });

      await createNotification(
        claimData.userId,
        "Claim Update",
        `Your claim for "${claimData.itemName}" is now ${status}.`,
        status === "approved" ? "success" : "warning"
      );
    }

    await refreshVisiblePages();
  } catch (error) {
    console.log(error);
  }
}

async function updateItemStatus(collectionName, itemId, status) {
  try {
    const itemRef = doc(db, collectionName, itemId);
    const itemSnap = await getDoc(itemRef);

    if (itemSnap.exists()) {
      const itemData = itemSnap.data();

      await updateDoc(itemRef, {
        status
      });

      await createNotification(
        itemData.userId,
        "Report Update",
        `Your item report "${itemData.itemName}" is now marked as ${status}.`,
        status === "resolved" || status === "claimed" ? "success" : "info"
      );
    }

    await refreshVisiblePages();
  } catch (error) {
    console.log(error);
  }
}

window.markLostResolved = function (itemId) {
  updateItemStatus("lostItems", itemId, "resolved");
};

window.markFoundClaimed = function (itemId) {
  updateItemStatus("foundItems", itemId, "claimed");
};

async function loadAdminData() {
  if (
    !adminLostItemsList &&
    !adminResolvedLostItemsList &&
    !adminFoundItemsList &&
    !adminResolvedFoundItemsList &&
    !adminClaimsList &&
    !adminReviewedClaimsList &&
    !adminMatchesList
  ) return;

  if (adminLostItemsList) adminLostItemsList.innerHTML = "Loading active lost items...";
  if (adminResolvedLostItemsList) adminResolvedLostItemsList.innerHTML = "Loading resolved lost items...";
  if (adminFoundItemsList) adminFoundItemsList.innerHTML = "Loading active found items...";
  if (adminResolvedFoundItemsList) adminResolvedFoundItemsList.innerHTML = "Loading claimed/resolved found items...";
  if (adminClaimsList) adminClaimsList.innerHTML = "Loading pending claims...";
  if (adminReviewedClaimsList) adminReviewedClaimsList.innerHTML = "Loading reviewed claims...";
  if (adminMatchesList) adminMatchesList.innerHTML = "Loading possible matches...";

  try {
    const lostSnapshot = await getDocs(collection(db, "lostItems"));
    const foundSnapshot = await getDocs(collection(db, "foundItems"));
    const claimsSnapshot = await getDocs(collection(db, "claims"));
    const matchesSnapshot = await getDocs(collection(db, "matchSuggestions"));

    if (adminLostItemsList) adminLostItemsList.innerHTML = "";
    if (adminResolvedLostItemsList) adminResolvedLostItemsList.innerHTML = "";
    if (adminFoundItemsList) adminFoundItemsList.innerHTML = "";
    if (adminResolvedFoundItemsList) adminResolvedFoundItemsList.innerHTML = "";
    if (adminClaimsList) adminClaimsList.innerHTML = "";
    if (adminReviewedClaimsList) adminReviewedClaimsList.innerHTML = "";
    if (adminMatchesList) adminMatchesList.innerHTML = "";

    const foundItemsById = new Map();
    const anyFoundKeys = new Set();
    const selfFoundKeys = new Set();
    const lostKeysByOwner = new Set();

    lostSnapshot.forEach((docItem) => {
      const item = docItem.data();
      lostKeysByOwner.add(buildOwnerItemKey(item.userId, item.itemName, item.category));
    });

    foundSnapshot.forEach((docItem) => {
      const item = docItem.data();
      foundItemsById.set(docItem.id, item);
      anyFoundKeys.add(buildItemKey(item.itemName, item.category));
      selfFoundKeys.add(buildOwnerItemKey(item.userId, item.itemName, item.category));
    });

    const approvedClaimFoundIds = new Set();
    const pendingClaimFoundIds = new Set();

    claimsSnapshot.forEach((docItem) => {
      const item = docItem.data();
      const currentStatus = normalizeText(item.claimStatus);
      const foundItemId = item.foundItemId || "";

      if (!foundItemId) return;
      if (currentStatus === "approved") approvedClaimFoundIds.add(foundItemId);
      if (currentStatus === "pending") pendingClaimFoundIds.add(foundItemId);
    });

    const approvedClaimKeys = new Set();
    approvedClaimFoundIds.forEach((foundItemId) => {
      const foundItem = foundItemsById.get(foundItemId);
      if (foundItem) approvedClaimKeys.add(buildItemKey(foundItem.itemName, foundItem.category));
    });

   lostSnapshot.forEach((docItem) => {
      const item = docItem.data();
      const currentStatus = normalizeText(item.status);
      const itemKey = buildItemKey(item.itemName, item.category);
      const ownerKey = buildOwnerItemKey(item.userId, item.itemName, item.category);
      const hasMatchingFoundReport = anyFoundKeys.has(itemKey);
      const hasSelfFoundReport = selfFoundKeys.has(ownerKey);
      const hasApprovedClaimMatch = approvedClaimKeys.has(itemKey);
      const isResolved = currentStatus === "resolved";

      let actionHtml = "";

      if (isResolved) {
        actionHtml = `<button disabled>Resolved</button>`;
      } else if (hasSelfFoundReport || hasApprovedClaimMatch) {
        actionHtml = `<button onclick="window.markLostResolved('${docItem.id}')">Mark Resolved</button>`;
      } else if (hasMatchingFoundReport) {
        actionHtml = `<button disabled>Waiting for claim approval</button>`;
      } else {
        actionHtml = `<button disabled>Waiting for found report</button>`;
      }

      const cardClass = isResolved ? "admin-box admin-box-muted" : "admin-box";
      const cardHtml = `
        <div class="${cardClass}">
          <h3>${item.itemName}</h3>
          <p><strong>Category:</strong> ${item.category}</p>
          <p><strong>Description:</strong> ${item.description}</p>
          <p><strong>Unique Marks:</strong> ${item.uniqueMarks || "—"}</p>
          <p><strong>Date Lost:</strong> ${item.dateLost}</p>
          <p><strong>Location Lost:</strong> ${item.locationLost}</p>
          <p><strong>Status:</strong> ${getStatusBadge(item.status)}</p>
          <div class="action-row">${actionHtml}</div>
        </div>
      `;

      if (isResolved) {
        if (adminResolvedLostItemsList) adminResolvedLostItemsList.innerHTML += cardHtml;
      } else {
        if (adminLostItemsList) adminLostItemsList.innerHTML += cardHtml;
      }
    });

    foundSnapshot.forEach((docItem) => {
      const item = docItem.data();
      const currentStatus = normalizeText(item.status);
      const ownerKey = buildOwnerItemKey(item.userId, item.itemName, item.category);
      const hasApprovedClaim = approvedClaimFoundIds.has(docItem.id);
      const hasPendingClaim = pendingClaimFoundIds.has(docItem.id);
      const selfOwnerRecovered = lostKeysByOwner.has(ownerKey);
      const isClosed = currentStatus === "claimed" || currentStatus === "resolved";

      let actionHtml = "";

      if (isClosed) {
        actionHtml = `<button disabled>Closed</button>`;
      } else if (hasApprovedClaim || selfOwnerRecovered) {
        actionHtml = `<button onclick="window.markFoundClaimed('${docItem.id}')">Mark Claimed</button>`;
      } else if (hasPendingClaim) {
        actionHtml = `<button disabled>Waiting for claim review</button>`;
      } else {
        actionHtml = `<button disabled>Waiting for matching claim</button>`;
      }

      const cardClass = isClosed ? "admin-box admin-box-muted" : "admin-box";
      const cardHtml = `
        <div class="${cardClass}">
          <h3>${item.itemName}</h3>
          <p><strong>Category:</strong> ${item.category}</p>
          <p><strong>Description:</strong> ${item.description}</p>
          <p><strong>Unique Marks:</strong> ${item.uniqueMarks || "—"}</p>
          <p><strong>Date Found:</strong> ${item.dateFound}</p>
          <p><strong>Location Found:</strong> ${item.locationFound}</p>
          <p><strong>Handed In At:</strong> ${item.handInLocation}</p>
          <p><strong>Status:</strong> ${getStatusBadge(item.status)}</p>
          <div class="action-row">${actionHtml}</div>
        </div>
      `;

      if (isClosed) {
        if (adminResolvedFoundItemsList) adminResolvedFoundItemsList.innerHTML += cardHtml;
      } else {
        if (adminFoundItemsList) adminFoundItemsList.innerHTML += cardHtml;
      }
    });

    claimsSnapshot.forEach((docItem) => {
      const item = docItem.data();
      const currentStatus = normalizeText(item.claimStatus);
      const hasLinkedFoundItem = !!item.foundItemId;
      const isPending = currentStatus === "pending" && hasLinkedFoundItem;

      let actionHtml = "";

      if (isPending) {
        actionHtml = `
          <button onclick="window.approveClaim('${docItem.id}')">Approve</button>
          <button onclick="window.rejectClaim('${docItem.id}')">Reject</button>
        `;
      } else if (!hasLinkedFoundItem) {
        actionHtml = `<button disabled>Legacy Claim</button>`;
      } else {
        actionHtml = `<button disabled>Reviewed</button>`;
      }

      const cardClass = isPending ? "admin-box" : "admin-box admin-box-muted";
      const cardHtml = `
        <div class="${cardClass}">
          <h3>${item.itemName}</h3>
          <p><strong>Lost Report:</strong> ${item.lostItemLabel || "Not linked"}</p>
          <p><strong>Found Report:</strong> ${item.foundItemLabel || "Not linked"}</p>
          <p><strong>Reason:</strong> ${item.reason}</p>
          <p><strong>Description:</strong> ${item.description}</p>
          <p><strong>Unique Marks:</strong> ${item.uniqueMarks}</p>
          <p><strong>Contents:</strong> ${item.contents}</p>
          <p><strong>Lost Place:</strong> ${item.lostPlace}</p>
          <p><strong>Lost Date:</strong> ${item.lostDate}</p>
          <p><strong>Match Score:</strong> ${item.matchScore || "—"}</p>
          <p><strong>Status:</strong> ${getStatusBadge(item.claimStatus)}</p>
          <div class="action-row">${actionHtml}</div>
        </div>
      `;

      if (isPending) {
        if (adminClaimsList) adminClaimsList.innerHTML += cardHtml;
      } else {
        if (adminReviewedClaimsList) adminReviewedClaimsList.innerHTML += cardHtml;
      }
    });

    if (adminMatchesList) {
      matchesSnapshot.forEach((docItem) => {
        const item = docItem.data();
        adminMatchesList.innerHTML += `
          <div class="admin-box">
            <h3>${item.lostItemName} ↔ ${item.foundItemName}</h3>
            <p><strong>Category:</strong> ${item.category || "—"}</p>
            <p><strong>Match Score:</strong> ${item.score || 0}</p>
            <p><strong>Why matched:</strong> ${(item.reasons || []).join(", ") || "—"}</p>
            <p><strong>Status:</strong> ${item.status || "suggested"}</p>
          </div>
        `;
      });
    }

    if (adminLostItemsList && adminLostItemsList.innerHTML === "") adminLostItemsList.innerHTML = "<p>No active lost reports.</p>";
    if (adminResolvedLostItemsList && adminResolvedLostItemsList.innerHTML === "") adminResolvedLostItemsList.innerHTML = "<p>No resolved lost reports yet.</p>";
    if (adminFoundItemsList && adminFoundItemsList.innerHTML === "") adminFoundItemsList.innerHTML = "<p>No active found reports.</p>";
    if (adminResolvedFoundItemsList && adminResolvedFoundItemsList.innerHTML === "") adminResolvedFoundItemsList.innerHTML = "<p>No claimed/resolved found reports yet.</p>";
    if (adminClaimsList && adminClaimsList.innerHTML === "") adminClaimsList.innerHTML = "<p>No pending claims.</p>";
    if (adminReviewedClaimsList && adminReviewedClaimsList.innerHTML === "") adminReviewedClaimsList.innerHTML = "<p>No reviewed claims yet.</p>";
    if (adminMatchesList && adminMatchesList.innerHTML === "") adminMatchesList.innerHTML = "<p>No possible matches yet.</p>";
  } catch (error) {
    if (adminLostItemsList) adminLostItemsList.innerHTML = "<p>Failed to load active lost reports.</p>";
    if (adminResolvedLostItemsList) adminResolvedLostItemsList.innerHTML = "<p>Failed to load resolved lost reports.</p>";
    if (adminFoundItemsList) adminFoundItemsList.innerHTML = "<p>Failed to load active found reports.</p>";
    if (adminResolvedFoundItemsList) adminResolvedFoundItemsList.innerHTML = "<p>Failed to load claimed/resolved found reports.</p>";
    if (adminClaimsList) adminClaimsList.innerHTML = "<p>Failed to load pending claims.</p>";
    if (adminReviewedClaimsList) adminReviewedClaimsList.innerHTML = "<p>Failed to load reviewed claims.</p>";
    if (adminMatchesList) adminMatchesList.innerHTML = "<p>Failed to load possible matches.</p>";
    console.log(error);
  }
}

window.approveClaim = function (claimId) {
  updateClaimStatus(claimId, "approved");
};

window.rejectClaim = function (claimId) {
  updateClaimStatus(claimId, "rejected");
};

if (adminLostCount || adminFoundCount || adminClaimsCount || adminMatchesCount) {
  loadAdminOverview();
}

if (adminLostItemsList || adminFoundItemsList || adminClaimsList || adminMatchesList) {
  loadAdminData();
}

/* AUTH STATE / PAGE PROTECTION */
onAuthStateChanged(auth, async (user) => {
  const path = window.location.pathname.toLowerCase();

  // Grab the hidden Dashboard nav button
  const navDashboard = document.getElementById("navDashboard");

  // MAGIC TRICK: Grab ALL links pointing to login or register anywhere on the page
  // This automatically catches Nav buttons, Hero buttons, and Forgot Password links!
  const authLinks = document.querySelectorAll('a[href="./login.html"], a[href="./register.html"]');

  const isAdminOverviewPage = path.endsWith("/admin") || path.endsWith("/admin.html");
  const isAdminLostPage = path.endsWith("/admin-lost") || path.endsWith("/admin-lost.html");
  const isAdminFoundPage = path.endsWith("/admin-found") || path.endsWith("/admin-found.html");
  const isAdminClaimsPage = path.endsWith("/admin-claims") || path.endsWith("/admin-claims.html");
  const isAdminMatchesPage = path.endsWith("/admin-matches") || path.endsWith("/admin-matches.html");
  const isAdminPage = isAdminOverviewPage || isAdminLostPage || isAdminFoundPage || isAdminClaimsPage || isAdminMatchesPage;

  const isDashboardPage = path.endsWith("/dashboard") || path.endsWith("/dashboard.html");
  const isLostPage = path.endsWith("/report-lost") || path.endsWith("/report-lost.html");
  const isFoundPage = path.endsWith("/report-found") || path.endsWith("/report-found.html");
  const isClaimPage = path.endsWith("/claim-item") || path.endsWith("/claim-item.html");
  const isSettingsPage = path.endsWith("/settings") || path.endsWith("/settings.html");
  const isMyReportsPage = path.endsWith("/my-reports") || path.endsWith("/my-reports.html");
  const isProfilePage = path.endsWith("/profile") || path.endsWith("/profile.html");

  if (user) {
    // IF LOGGED IN: Show Dashboard nav, Hide ALL Auth & Forgot Password links
    if (navDashboard) navDashboard.style.display = "inline-flex";
    authLinks.forEach(link => link.style.display = "none");

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      let role = "student";
      let fullName = "User";

      if (userSnap.exists()) {
        const userData = userSnap.data();
        role = userData.role || "student";
        fullName = userData.fullName || "User";
      }

      if (welcomeUser) {
        if ((role || "").toLowerCase() === "admin") {
          welcomeUser.textContent = `Welcome, ${fullName} (Admin).`;
        } else {
          welcomeUser.textContent = `Welcome, ${fullName}.`;
        }
      }

      const normalizedRole = (role || "").trim().toLowerCase();

      if (normalizedRole !== "admin" && isAdminPage) {
        alert("Access denied.");
        window.location.href = "./dashboard.html";
        return;
      }

      if (normalizedRole === "admin" && isDashboardPage) {
        window.location.href = "./admin.html";
        return;
      }

      if (isSettingsPage) loadSettings(user);
      if (isMyReportsPage) loadMyReports(user.uid);
      if (claimLostItemSelect) loadUserLostReports(user.uid);
      if (isProfilePage) loadProfile(user);
      if (notificationsList) loadNotifications(user.uid);
      
    } catch (error) {
      console.log(error);
    }
  } else {
    // IF NOT LOGGED IN: Hide Dashboard nav, Show Auth & Forgot Password links
    if (navDashboard) navDashboard.style.display = "none";
    
    // Leaving the display as an empty string resets it back to its normal CSS state
    authLinks.forEach(link => link.style.display = "");

    if (isAdminPage || isDashboardPage || isLostPage || isFoundPage || isClaimPage || isSettingsPage || isMyReportsPage || isProfilePage) {
      window.location.href = "./login.html";
    }
  }
});