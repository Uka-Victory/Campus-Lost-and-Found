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

const adminLostFilter = document.getElementById("adminLostFilter");
const adminFoundFilter = document.getElementById("adminFoundFilter");
const adminLostActiveSection = document.getElementById("adminLostActiveSection");
const adminLostResolvedSection = document.getElementById("adminLostResolvedSection");
const adminFoundActiveSection = document.getElementById("adminFoundActiveSection");
const adminFoundResolvedSection = document.getElementById("adminFoundResolvedSection");

const myLostItemsList = document.getElementById("myLostItemsList");
const myFoundItemsList = document.getElementById("myFoundItemsList");
const myClaimsList = document.getElementById("myClaimsList");

const notificationsList = document.getElementById("notificationsList");
const notifBtn = document.getElementById("notifBtn");
const notifDropdown = document.getElementById("notifDropdown");

const profileMenuBtn = document.getElementById("profileMenuBtn");
const profileDropdown = document.getElementById("profileDropdown");

const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profilePhone = document.getElementById("profilePhone");
const profileFaculty = document.getElementById("profileFaculty");
const profileDepartment = document.getElementById("profileDepartment");
const profileLevel = document.getElementById("profileLevel");
const profileRole = document.getElementById("profileRole");
const profileMatric = document.getElementById("profileMatric");
const profilePassport = document.getElementById("profilePassport");

const themeLightBtn = document.getElementById("themeLightBtn");
const themeDarkBtn = document.getElementById("themeDarkBtn");
const themeAutoBtn = document.getElementById("themeAutoBtn");
const currentThemeLabel = document.getElementById("currentThemeLabel");

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
  return await getDownloadURL(fileRef);
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

function showPopup(text, icon = "info") {
  if (typeof Swal !== "undefined") {
    Swal.fire({
      text: text,
      icon: icon,
      confirmButtonColor: "#1e3a8a"
    });
  }
}

/* THEME SYSTEM */
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
  if (themeLightBtn) themeLightBtn.addEventListener("click", () => saveThemeMode("light"));
  if (themeDarkBtn) themeDarkBtn.addEventListener("click", () => saveThemeMode("dark"));
  if (themeAutoBtn) themeAutoBtn.addEventListener("click", () => saveThemeMode("auto"));
  updateThemeControls(getStoredThemeMode());
}

if (systemThemeQuery.addEventListener) {
  systemThemeQuery.addEventListener("change", () => {
    if (getStoredThemeMode() === "auto") applyTheme("auto");
  });
}

/* TEXT TOKENIZATION & MATCHING ENGINE */
const STOP_WORDS = new Set(["the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "with", "is", "was", "it", "my", "of", "this", "that", "i", "lost", "found", "item", "please", "phone", "bag", "device"]);

function normalizeText(value) {
  return (value || "").trim().toLowerCase();
}

function tokenizeText(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
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
  const diffMs = Math.abs(new Date(dateA).getTime() - new Date(dateB).getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 2) return 10;
  if (diffDays <= 7) return 7;
  if (diffDays <= 14) return 4;
  return 0;
}

/* STRICT SIMILARITY ALGORITHM */
function calculatePossibleMatch(lostItem, foundItem) {
  let score = 0;
  const reasons = [];

  const lostCat = normalizeText(lostItem.category);
  const foundCat = normalizeText(foundItem.category);

  // 1. Mandatory Category Match (unless both categorize as "Others")
  if (lostCat && foundCat && lostCat === foundCat) {
    score += 35;
    reasons.push("same category");
  } else if (lostCat === "others" && foundCat === "others") {
    score += 15;
    reasons.push("category: others");
  } else {
    // Immediate disqualification if categories disagree
    return { score: 0, reasons: [] };
  }

  // 2. Name Similarity
  const nameSim = textSimilarity(lostItem.itemName, foundItem.itemName);
  if (nameSim >= 0.5) {
    score += 35;
    reasons.push("strong item title similarity");
  } else if (nameSim >= 0.25) {
    score += 20;
    reasons.push("item title similarity");
  }

  // 3. Keyword / Description Overlap
  const detailsSim = textSimilarity(
    `${lostItem.description || ""} ${lostItem.uniqueMarks || ""}`,
    `${foundItem.description || ""} ${foundItem.uniqueMarks || ""}`
  );
  if (detailsSim >= 0.3) {
    score += 20;
    reasons.push("description match");
  } else if (detailsSim >= 0.12) {
    score += 10;
    reasons.push("partial description match");
  }

  // 4. Location Proximity
  const locSim = textSimilarity(lostItem.locationLost, foundItem.locationFound);
  if (locSim >= 0.3) {
    score += 10;
    reasons.push("matching campus area");
  }

  // 5. Date Proximity
  const dateScore = dateClosenessScore(lostItem.dateLost, foundItem.dateFound);
  if (dateScore > 0) {
    score += dateScore;
    reasons.push("reported close in date");
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
    console.log("Notification error:", error);
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
    "Potential Match Found",
    `A found report matching "${lostItem.itemName}" was posted (${matchData.score}% match). Click to inspect and file a claim.`,
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
    if (normalizeText(lostItem.status) === "resolved") continue;
    if (lostItem.userId === foundItem.userId) continue;

    const matchData = calculatePossibleMatch(lostItem, foundItem);
    if (matchData.score >= 50) {
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
    if (matchData.score >= 50) {
      await createPossibleMatchSuggestion(lostItemId, lostItem, docItem.id, foundItem, matchData);
    }
  }
}

/* CLAIMS DROPDOWN LINKING */
function syncClaimItemName() {
  if (!claimFoundItemSelect || !claimItemNameInput) return;
  const selectedOption = claimFoundItemSelect.options[claimFoundItemSelect.selectedIndex];
  claimItemNameInput.value = selectedOption?.dataset?.itemName || "";
}

function resetClaimFoundItems() {
  if (claimFoundItemSelect) {
    claimFoundItemSelect.innerHTML = `<option value="">Select your lost report first</option>`;
  }
  if (claimItemNameInput) claimItemNameInput.value = "";
  if (claimMatchMessage) claimMatchMessage.textContent = "";
}

async function loadUserLostReports(userId) {
  if (!claimLostItemSelect) return;
  claimLostItemSelect.innerHTML = `<option value="">Loading your active lost reports...</option>`;

  try {
    const snapshot = await getDocs(collection(db, "lostItems"));
    claimLostItemSelect.innerHTML = `<option value="">Select your lost report</option>`;
    let count = 0;

    snapshot.forEach((docItem) => {
      const item = docItem.data();
      if (item.userId !== userId || normalizeText(item.status) === "resolved") return;

      const option = document.createElement("option");
      option.value = docItem.id;
      option.dataset.itemName = item.itemName || "";
      option.dataset.category = item.category || "";
      option.textContent = `${item.itemName} (${item.category}) - Lost on ${item.dateLost || "N/A"}`;
      claimLostItemSelect.appendChild(option);
      count += 1;
    });

    if (count === 0) {
      claimLostItemSelect.innerHTML = `<option value="">You have no active lost reports</option>`;
    }
    resetClaimFoundItems();
  } catch (error) {
    console.log(error);
    claimLostItemSelect.innerHTML = `<option value="">Failed to load reports</option>`;
    resetClaimFoundItems();
  }
}

async function loadMatchedFoundItemsForLostReport(lostItemId, userId) {
  if (!claimFoundItemSelect) return;
  if (!lostItemId) {
    resetClaimFoundItems();
    return;
  }

  claimFoundItemSelect.innerHTML = `<option value="">Searching matching found reports...</option>`;

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
      if (matchData.score >= 50) {
        matches.push({
          id: docItem.id,
          data: foundItem,
          score: matchData.score
        });
      }
    });

    matches.sort((a, b) => b.score - a.score);

    if (matches.length === 0) {
      claimFoundItemSelect.innerHTML = `<option value="">No matching found items available</option>`;
      if (claimMatchMessage) {
        claimMatchMessage.textContent = "No verified matching found items found. Try updating your lost report description.";
      }
      syncClaimItemName();
      return;
    }

    claimFoundItemSelect.innerHTML = `<option value="">Select a matched found report</option>`;
    matches.forEach((match) => {
      const option = document.createElement("option");
      option.value = match.id;
      option.dataset.itemName = match.data.itemName || "";
      option.dataset.category = match.data.category || "";
      option.textContent = `${match.data.itemName} • ${match.data.category} • Match Score: ${match.score}%`;
      claimFoundItemSelect.appendChild(option);
    });

    if (claimMatchMessage) {
      claimMatchMessage.textContent = `${matches.length} matching found item(s) available for claim.`;
    }
    syncClaimItemName();
  } catch (error) {
    console.log(error);
    claimFoundItemSelect.innerHTML = `<option value="">Error evaluating reports</option>`;
  }
}

if (claimFoundItemSelect) claimFoundItemSelect.addEventListener("change", syncClaimItemName);
if (claimLostItemSelect) {
  claimLostItemSelect.addEventListener("change", async () => {
    const user = auth.currentUser;
    if (user) await loadMatchedFoundItemsForLostReport(claimLostItemSelect.value, user.uid);
  });
}

/* AUTHENTICATION */
if (registerForm) {
  registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const submitBtn = registerForm.querySelector('button[type="submit"]');

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
      showPopup("Please fill in all required fields.", "warning");
      return;
    }

    if (password.length < 6) {
      showPopup("Password must be at least 6 characters long.", "warning");
      return;
    }

    if (password !== confirmPassword) {
      showPopup("Passwords do not match.", "warning");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Registering...";
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
          if (passportUrl) {
            await updateDoc(doc(db, "users", createdUser.uid), { passportUrl });
          }
        } catch (err) {
          console.log("Passport upload error:", err);
        }
      }

      showPopup("Registration successful! Redirecting to login...", "success");
      registerForm.reset();
      setTimeout(() => { window.location.href = "./login.html"; }, 1500);
    } catch (error) {
      console.log(error);
      if (createdUser) await deleteUser(createdUser).catch(() => {});
      showPopup(error.message || "Registration failed.", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Register";
      }
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (!userSnap.exists()) {
        showPopup("Profile data missing in database.", "error");
        await signOut(auth);
        return;
      }

      const role = (userSnap.data().role || "").toLowerCase();
      window.location.href = role === "admin" ? "./admin.html" : "./dashboard.html";
    } catch (error) {
      showPopup(error.message || "Login failed.", "error");
    }
  });
}

if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", async (e) => {
    e.preventDefault();
    let email = document.getElementById("loginEmail")?.value.trim();
    if (!email) {
      const { value: inputEmail } = await Swal.fire({
        title: "Reset Password",
        input: "email",
        inputLabel: "Enter your registered email address:",
        confirmButtonColor: "#1e3a8a",
        showCancelButton: true
      });
      if (!inputEmail) return;
      email = inputEmail.trim();
    }
    try {
      await sendPasswordResetEmail(auth, email);
      showPopup("Password reset email sent. Please check your inbox.", "success");
    } catch (err) {
      showPopup(err.message, "error");
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    await signOut(auth);
    window.location.href = "./index.html";
  });
}

/* SETTINGS & PROFILE */
async function loadSettings(user) {
  if (!settingsForm) return;
  try {
    const userSnap = await getDoc(doc(db, "users", user.uid));
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
    const userSnap = await getDoc(doc(db, "users", user.uid));
    if (!userSnap.exists()) return;
    const data = userSnap.data();

    profileName.textContent = data.fullName || "Student";
    if (profileEmail) profileEmail.textContent = data.email || user.email || "-";
    if (profileMatric) profileMatric.textContent = data.matricNo || "-";
    if (profilePhone) profilePhone.textContent = data.phone || "-";
    if (profileFaculty) profileFaculty.textContent = data.faculty || "-";
    if (profileDepartment) profileDepartment.textContent = data.department || "-";
    if (profileLevel) profileLevel.textContent = data.level || "-";
    if (profileRole) profileRole.textContent = data.role || "student";
    if (profilePassport && data.passportUrl) profilePassport.src = data.passportUrl;
  } catch (error) {
    console.log(error);
  }
}

if (settingsForm) {
  settingsForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

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
      const emailChanged = user.email !== email;
      const wantsPasswordChange = newPassword.trim() !== "";

      if (wantsPasswordChange && newPassword !== confirmNewPassword) {
        showPopup("New passwords do not match.", "warning");
        return;
      }

      if ((emailChanged || wantsPasswordChange) && !currentPassword) {
        showPopup("Current password is required to change email or password.", "warning");
        return;
      }

      if (emailChanged || wantsPasswordChange) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
      }

      if (emailChanged) await updateEmail(user, email);
      if (wantsPasswordChange) await updatePassword(user, newPassword);

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { fullName, phone, email, faculty, department, level });

      if (settingsPassportFile) {
        const passportUrl = await uploadImage(settingsPassportFile, "passports");
        if (passportUrl) await updateDoc(userRef, { passportUrl });
      }

      showPopup("Settings updated successfully.", "success");
      document.getElementById("currentPassword").value = "";
      document.getElementById("newPassword").value = "";
      document.getElementById("confirmNewPassword").value = "";
      await loadSettings(user);
    } catch (error) {
      showPopup(error.message || "Failed to update settings.", "error");
    }
  });
}

/* REPORT LOST */
if (lostItemForm) {
  lostItemForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const itemName = document.getElementById("itemName").value.trim();
    const category = document.getElementById("category").value;
    const description = document.getElementById("description").value.trim();
    const uniqueMarks = document.getElementById("lostUniqueMarks").value.trim();
    const dateLost = document.getElementById("dateLost").value;
    const locationLost = document.getElementById("locationLost").value.trim();
    const lostImageFile = document.getElementById("lostImage")?.files[0] || null;

    try {
      let imageUrl = "";
      if (lostImageFile) imageUrl = await uploadImage(lostImageFile, "lost-items");

      const itemData = {
        userId: user.uid,
        itemName,
        category,
        description,
        uniqueMarks,
        dateLost,
        locationLost,
        imageUrl,
        status: "open",
        createdAt: new Date().toISOString()
      };

      const newLostRef = await addDoc(collection(db, "lostItems"), itemData);
      await checkPossibleMatchesForLostItem(newLostRef.id, itemData);

      showPopup("Lost item report submitted successfully.", "success");
      lostItemForm.reset();
      if (lostImagePreview) lostImagePreview.style.display = "none";
    } catch (err) {
      showPopup(err.message || "Error submitting report.", "error");
    }
  });
}

/* REPORT FOUND */
if (foundItemForm) {
  foundItemForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const itemName = document.getElementById("foundItemName").value.trim();
    const category = document.getElementById("foundCategory").value;
    const description = document.getElementById("foundDescription").value.trim();
    const uniqueMarks = document.getElementById("foundUniqueMarks").value.trim();
    const dateFound = document.getElementById("dateFound").value;
    const locationFound = document.getElementById("locationFound").value.trim();
    const handInLocation = document.getElementById("handInLocation").value.trim();
    const privateNote = document.getElementById("privateNote").value.trim();
    const foundImageFile = document.getElementById("foundImage")?.files[0] || null;

    try {
      let imageUrl = "";
      if (foundImageFile) imageUrl = await uploadImage(foundImageFile, "found-items");

      const itemData = {
        userId: user.uid,
        itemName,
        category,
        description,
        uniqueMarks,
        dateFound,
        locationFound,
        handInLocation,
        privateNote,
        imageUrl,
        status: "open",
        createdAt: new Date().toISOString()
      };

      const newFoundRef = await addDoc(collection(db, "foundItems"), itemData);
      await checkPossibleMatchesForFoundItem(newFoundRef.id, itemData);

      showPopup("Found item report submitted successfully.", "success");
      foundItemForm.reset();
      if (foundImagePreview) foundImagePreview.style.display = "none";
    } catch (err) {
      showPopup(err.message || "Error submitting report.", "error");
    }
  });
}

/* CLAIM SUBMISSION */
if (claimForm) {
  claimForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const selectedLostItemId = claimLostItemSelect?.value || "";
    const selectedFoundItemId = claimFoundItemSelect?.value || "";
    const claimReason = document.getElementById("claimReason").value.trim();
    const claimDescription = document.getElementById("claimDescription").value.trim();
    const claimUniqueMarks = document.getElementById("claimUniqueMarks").value.trim();
    const claimContents = document.getElementById("claimContents").value.trim();
    const claimLostPlace = document.getElementById("claimLostPlace").value.trim();
    const claimLostDate = document.getElementById("claimLostDate").value;

    if (!selectedLostItemId || !selectedFoundItemId) {
      showPopup("Please select both your lost report and a matching found item.", "warning");
      return;
    }

    try {
      const [lostSnap, foundSnap] = await Promise.all([
        getDoc(doc(db, "lostItems", selectedLostItemId)),
        getDoc(doc(db, "foundItems", selectedFoundItemId))
      ]);

      if (!lostSnap.exists() || !foundSnap.exists()) {
        showPopup("One of the selected reports is no longer active.", "error");
        return;
      }

      const lostData = lostSnap.data();
      const foundData = foundSnap.data();

      const matchData = calculatePossibleMatch(lostData, foundData);
      if (matchData.score < 50) {
        showPopup("This item is no longer marked as an eligible match.", "warning");
        return;
      }

      await addDoc(collection(db, "claims"), {
        userId: user.uid,
        lostItemId: selectedLostItemId,
        lostItemLabel: `${lostData.itemName} (${lostData.category})`,
        foundItemId: selectedFoundItemId,
        foundItemLabel: `${foundData.itemName} (${foundData.category})`,
        itemName: foundData.itemName || lostData.itemName,
        category: foundData.category,
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

      showPopup("Claim submitted successfully for admin verification.", "success");
      claimForm.reset();
      resetClaimFoundItems();
      await loadUserLostReports(user.uid);
    } catch (err) {
      showPopup(err.message || "Claim submission failed.", "error");
    }
  });
}

/* PUBLIC BROWSING - WITH SENSITIVE FOUND DETAILS REDACTED */
async function loadItems() {
  if (!lostItemsList && !foundItemsList) return;

  const searchText = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const selectedCategory = categoryFilter ? categoryFilter.value.trim().toLowerCase() : "";

  try {
    const [lostSnap, foundSnap] = await Promise.all([
      getDocs(collection(db, "lostItems")),
      getDocs(collection(db, "foundItems"))
    ]);

    if (lostItemsList) lostItemsList.innerHTML = "";
    if (foundItemsList) foundItemsList.innerHTML = "";

    let lostCount = 0;
    lostSnap.forEach((docItem) => {
      const item = docItem.data();
      if (normalizeText(item.status) === "resolved") return;

      const itemName = (item.itemName || "").toLowerCase();
      const category = (item.category || "").toLowerCase();
      if (searchText && !itemName.includes(searchText) && !category.includes(searchText)) return;
      if (selectedCategory && category !== selectedCategory) return;

      lostCount++;
      if (lostItemsList) {
        lostItemsList.innerHTML += `
          <div class="items-box">
            <h3>${item.itemName}</h3>
            <p><strong>Category:</strong> ${item.category}</p>
            <p><strong>General Description:</strong> ${item.description}</p>
            <p><strong>Date Lost:</strong> ${item.dateLost}</p>
            <p><strong>Location Lost:</strong> ${item.locationLost}</p>
            <p><strong>Status:</strong> ${getStatusBadge(item.status)}</p>
            ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.itemName}" class="item-thumb" />` : ""}
          </div>
        `;
      }
    });

    let foundCount = 0;
    foundSnap.forEach((docItem) => {
      const item = docItem.data();
      const st = normalizeText(item.status);
      if (st === "claimed" || st === "resolved") return;

      const itemName = (item.itemName || "").toLowerCase();
      const category = (item.category || "").toLowerCase();
      if (searchText && !itemName.includes(searchText) && !category.includes(searchText)) return;
      if (selectedCategory && category !== selectedCategory) return;

      foundCount++;
      if (foundItemsList) {
        // Redacts uniqueMarks, privateNote, exact custody details for fraud prevention
        foundItemsList.innerHTML += `
          <div class="items-box">
            <h3>${item.itemName}</h3>
            <p><strong>Category:</strong> ${item.category}</p>
            <p><strong>General Description:</strong> ${item.description}</p>
            <p><strong>Date Found:</strong> ${item.dateFound}</p>
            <p><strong>Found Near:</strong> ${item.locationFound}</p>
            <p><strong>Status:</strong> ${getStatusBadge(item.status)}</p>
            ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.itemName}" class="item-thumb" />` : ""}
          </div>
        `;
      }
    });

    if (lostItemsList && lostCount === 0) lostItemsList.innerHTML = "<p>No active lost items found.</p>";
    if (foundItemsList && foundCount === 0) foundItemsList.innerHTML = "<p>No active found items found.</p>";
    setupImageModal();
  } catch (err) {
    console.log(err);
  }
}

if (lostItemsList || foundItemsList) loadItems();
if (searchBtn) searchBtn.addEventListener("click", loadItems);
if (categoryFilter) categoryFilter.addEventListener("change", loadItems);
if (searchInput) searchInput.addEventListener("input", loadItems);

/* USER MY REPORTS CRUD */
async function loadMyReports(userId) {
  if (!myLostItemsList || !myFoundItemsList || !myClaimsList) return;

  try {
    const [lostSnap, foundSnap, claimsSnap] = await Promise.all([
      getDocs(collection(db, "lostItems")),
      getDocs(collection(db, "foundItems")),
      getDocs(collection(db, "claims"))
    ]);

    myLostItemsList.innerHTML = "";
    myFoundItemsList.innerHTML = "";
    myClaimsList.innerHTML = "";

    lostSnap.forEach((docItem) => {
      const item = docItem.data();
      if (item.userId !== userId) return;

      myLostItemsList.innerHTML += `
        <div class="items-box">
          <h3>${item.itemName}</h3>
          <p><strong>Category:</strong> ${item.category}</p>
          <p><strong>Description:</strong> ${item.description}</p>
          <p><strong>Date Lost:</strong> ${item.dateLost}</p>
          <p><strong>Location:</strong> ${item.locationLost}</p>
          <p><strong>Status:</strong> ${getStatusBadge(item.status)}</p>
          ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.itemName}" class="item-thumb" />` : ""}
          <div class="action-row">
            <button onclick="window.editLostReport('${docItem.id}')">Edit</button>
            <button onclick="window.deleteLostReport('${docItem.id}')">Delete</button>
          </div>
        </div>
      `;
    });

    foundSnap.forEach((docItem) => {
      const item = docItem.data();
      if (item.userId !== userId) return;

      myFoundItemsList.innerHTML += `
        <div class="items-box">
          <h3>${item.itemName}</h3>
          <p><strong>Category:</strong> ${item.category}</p>
          <p><strong>Description:</strong> ${item.description}</p>
          <p><strong>Date Found:</strong> ${item.dateFound}</p>
          <p><strong>Handed In:</strong> ${item.handInLocation}</p>
          <p><strong>Status:</strong> ${getStatusBadge(item.status)}</p>
          ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.itemName}" class="item-thumb" />` : ""}
          <div class="action-row">
            <button onclick="window.editFoundReport('${docItem.id}')">Edit</button>
            <button onclick="window.deleteFoundReport('${docItem.id}')">Delete</button>
          </div>
        </div>
      `;
    });

    claimsSnap.forEach((docItem) => {
      const item = docItem.data();
      if (item.userId !== userId) return;

      myClaimsList.innerHTML += `
        <div class="items-box">
          <h3>${item.itemName}</h3>
          <p><strong>Proof Submitted:</strong> ${item.reason}</p>
          <p><strong>Details:</strong> ${item.description}</p>
          <p><strong>Verification Status:</strong> ${getStatusBadge(item.claimStatus)}</p>
          <div class="action-row">
            <button onclick="window.editClaimReport('${docItem.id}')">Edit</button>
            <button onclick="window.deleteClaimReport('${docItem.id}')">Delete</button>
          </div>
        </div>
      `;
    });

    if (myLostItemsList.innerHTML === "") myLostItemsList.innerHTML = "<p>You have no active lost item reports.</p>";
    if (myFoundItemsList.innerHTML === "") myFoundItemsList.innerHTML = "<p>You have no active found item reports.</p>";
    if (myClaimsList.innerHTML === "") myClaimsList.innerHTML = "<p>You have not submitted any claims.</p>";
    setupImageModal();
  } catch (err) {
    console.log(err);
  }
}

window.editLostReport = async (reportId) => {
  const refDoc = doc(db, "lostItems", reportId);
  const snap = await getDoc(refDoc);
  if (!snap.exists()) return;
  const data = snap.data();

  const { value: newDesc } = await Swal.fire({
    title: "Edit Description",
    input: "textarea",
    inputValue: data.description || "",
    confirmButtonColor: "#1e3a8a",
    showCancelButton: true
  });
  if (newDesc === undefined) return;

  await updateDoc(refDoc, { description: newDesc.trim() });
  if (auth.currentUser) await loadMyReports(auth.currentUser.uid);
};

window.deleteLostReport = async (reportId) => {
  const res = await Swal.fire({
    title: "Delete Report?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    confirmButtonText: "Yes, delete"
  });
  if (!res.isConfirmed) return;
  await deleteDoc(doc(db, "lostItems", reportId));
  if (auth.currentUser) await loadMyReports(auth.currentUser.uid);
};

window.editFoundReport = async (reportId) => {
  const refDoc = doc(db, "foundItems", reportId);
  const snap = await getDoc(refDoc);
  if (!snap.exists()) return;
  const data = snap.data();

  const { value: newDesc } = await Swal.fire({
    title: "Edit Description",
    input: "textarea",
    inputValue: data.description || "",
    confirmButtonColor: "#1e3a8a",
    showCancelButton: true
  });
  if (newDesc === undefined) return;

  await updateDoc(refDoc, { description: newDesc.trim() });
  if (auth.currentUser) await loadMyReports(auth.currentUser.uid);
};

window.deleteFoundReport = async (reportId) => {
  const res = await Swal.fire({
    title: "Delete Report?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    confirmButtonText: "Yes, delete"
  });
  if (!res.isConfirmed) return;
  await deleteDoc(doc(db, "foundItems", reportId));
  if (auth.currentUser) await loadMyReports(auth.currentUser.uid);
};

window.editClaimReport = async (reportId) => {
  const refDoc = doc(db, "claims", reportId);
  const snap = await getDoc(refDoc);
  if (!snap.exists()) return;
  const data = snap.data();

  const { value: newReason } = await Swal.fire({
    title: "Edit Ownership Proof",
    input: "textarea",
    inputValue: data.reason || "",
    confirmButtonColor: "#1e3a8a",
    showCancelButton: true
  });
  if (newReason === undefined) return;

  await updateDoc(refDoc, { reason: newReason.trim() });
  if (auth.currentUser) await loadMyReports(auth.currentUser.uid);
};

window.deleteClaimReport = async (reportId) => {
  const res = await Swal.fire({
    title: "Delete Claim?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    confirmButtonText: "Yes, delete"
  });
  if (!res.isConfirmed) return;
  await deleteDoc(doc(db, "claims", reportId));
  if (auth.currentUser) await loadMyReports(auth.currentUser.uid);
};

/* NOTIFICATIONS */
async function loadNotifications(userId) {
  if (!notificationsList) return;
  notificationsList.innerHTML = "Loading notifications...";

  try {
    const snapshot = await getDocs(collection(db, "notifications"));
    const items = [];

    snapshot.forEach((docItem) => {
      const data = docItem.data();
      if (data.userId === userId) items.push({ id: docItem.id, ...data });
    });

    items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    notificationsList.innerHTML = "";

    const notifBadge = document.getElementById("notifBadge");
    if (notifBadge) {
      notifBadge.textContent = items.length;
      notifBadge.style.display = items.length > 0 ? "inline-block" : "none";
    }

    if (items.length === 0) {
      notificationsList.innerHTML = `<p class="helper-note" style="padding: 12px; text-align: center;">No notifications available.</p>`;
      return;
    }

    items.slice(0, 15).forEach((item) => {
      let clickAction = "";
      if (item.notificationKind === "possible_match") {
        clickAction = `onclick="window.location.href='./claim-item.html'"`;
      } else if (item.notificationKind === "claim_decision") {
        clickAction = `onclick="window.location.href='./my-reports.html'"`;
      }

      notificationsList.innerHTML += `
        <div class="notification-item notif-item-small notification-${item.type || "info"}" style="cursor: pointer;" ${clickAction}>
          <button class="notif-delete-btn" onclick="event.stopPropagation(); window.deleteNotification('${item.id}')">✖</button>
          <p><strong>${item.title}</strong></p>
          <p>${item.text}</p>
        </div>
      `;
    });
  } catch (err) {
    notificationsList.innerHTML = "<p class='helper-note' style='padding: 10px;'>No notifications available.</p>";
  }
}

window.deleteNotification = async function (notifId) {
  try {
    await deleteDoc(doc(db, "notifications", notifId));
    if (auth.currentUser) await loadNotifications(auth.currentUser.uid);
  } catch (err) {
    console.log(err);
  }
};

if (notifBtn && notifDropdown) {
  notifBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    notifDropdown.classList.toggle("show");
  });
  document.addEventListener("click", (e) => {
    if (!notifDropdown.contains(e.target) && e.target !== notifBtn) {
      notifDropdown.classList.remove("show");
    }
  });
}

/* ADMIN OVERVIEW & CLAIMS COMPARISON */
async function loadAdminOverview() {
  if (!adminLostCount && !adminFoundCount && !adminClaimsCount && !adminMatchesCount) return;
  try {
    const [lostSnap, foundSnap, claimsSnap, matchesSnap] = await Promise.all([
      getDocs(collection(db, "lostItems")),
      getDocs(collection(db, "foundItems")),
      getDocs(collection(db, "claims")),
      getDocs(collection(db, "matchSuggestions"))
    ]);

    let activeLost = 0, resolvedLost = 0;
    lostSnap.forEach((d) => normalizeText(d.data().status) === "resolved" ? resolvedLost++ : activeLost++);

    let activeFound = 0, closedFound = 0;
    foundSnap.forEach((d) => {
      const st = normalizeText(d.data().status);
      st === "claimed" || st === "resolved" ? closedFound++ : activeFound++;
    });

    let pendingClaims = 0, reviewedClaims = 0;
    claimsSnap.forEach((d) => normalizeText(d.data().claimStatus) === "pending" ? pendingClaims++ : reviewedClaims++);

    let openMatches = 0, archivedMatches = 0;
    matchesSnap.forEach((d) => {
      const st = normalizeText(d.data().status);
      !st || st === "suggested" || st === "open" ? openMatches++ : archivedMatches++;
    });

    if (adminLostCount) adminLostCount.textContent = `${activeLost} active`;
    if (adminFoundCount) adminFoundCount.textContent = `${activeFound} active`;
    if (adminClaimsCount) adminClaimsCount.textContent = `${pendingClaims} pending`;
    if (adminMatchesCount) adminMatchesCount.textContent = `${openMatches} open`;

    if (adminLostMeta) adminLostMeta.textContent = `${resolvedLost} resolved`;
    if (adminFoundMeta) adminFoundMeta.textContent = `${closedFound} closed`;
    if (adminClaimsMeta) adminClaimsMeta.textContent = `${reviewedClaims} reviewed`;
    if (adminMatchesMeta) adminMatchesMeta.textContent = `${archivedMatches} archived`;
  } catch (err) {
    console.log(err);
  }
}

async function loadAdminData() {
  if (!adminLostItemsList && !adminFoundItemsList && !adminClaimsList && !adminMatchesList) return;

  try {
    const [lostSnap, foundSnap, claimsSnap, matchesSnap] = await Promise.all([
      getDocs(collection(db, "lostItems")),
      getDocs(collection(db, "foundItems")),
      getDocs(collection(db, "claims")),
      getDocs(collection(db, "matchSuggestions"))
    ]);

    const lostMap = new Map();
    lostSnap.forEach((d) => lostMap.set(d.id, d.data()));

    const foundMap = new Map();
    foundSnap.forEach((d) => foundMap.set(d.id, d.data()));

    if (adminLostItemsList) adminLostItemsList.innerHTML = "";
    if (adminResolvedLostItemsList) adminResolvedLostItemsList.innerHTML = "";
    if (adminFoundItemsList) adminFoundItemsList.innerHTML = "";
    if (adminResolvedFoundItemsList) adminResolvedFoundItemsList.innerHTML = "";
    if (adminClaimsList) adminClaimsList.innerHTML = "";
    if (adminReviewedClaimsList) adminReviewedClaimsList.innerHTML = "";
    if (adminMatchesList) adminMatchesList.innerHTML = "";

    // Admin Lost
    lostSnap.forEach((docItem) => {
      const item = docItem.data();
      const isResolved = normalizeText(item.status) === "resolved";
      const card = `
        <div class="admin-box ${isResolved ? "admin-box-muted" : ""}">
          <h3>${item.itemName}</h3>
          <p><strong>Category:</strong> ${item.category}</p>
          <p><strong>Description:</strong> ${item.description}</p>
          <p><strong>Unique Marks:</strong> ${item.uniqueMarks || "None"}</p>
          <p><strong>Location:</strong> ${item.locationLost}</p>
          <p><strong>Status:</strong> ${getStatusBadge(item.status)}</p>
          <div class="action-row">
            ${!isResolved ? `<button onclick="window.markLostResolved('${docItem.id}')">Mark Resolved</button>` : `<button disabled>Resolved</button>`}
          </div>
        </div>
      `;
      if (isResolved && adminResolvedLostItemsList) adminResolvedLostItemsList.innerHTML += card;
      if (!isResolved && adminLostItemsList) adminLostItemsList.innerHTML += card;
    });

    // Admin Found (with Admin-Only Confidential Data)
    foundSnap.forEach((docItem) => {
      const item = docItem.data();
      const isClosed = normalizeText(item.status) === "claimed" || normalizeText(item.status) === "resolved";
      const card = `
        <div class="admin-box ${isClosed ? "admin-box-muted" : ""}">
          <h3>${item.itemName}</h3>
          <p><strong>Category:</strong> ${item.category}</p>
          <p><strong>Description:</strong> ${item.description}</p>
          <p><strong>Exact Found Place:</strong> ${item.locationFound}</p>
          <p class="admin-confidential-field"><strong>Handed In At:</strong> ${item.handInLocation}</p>
          <p class="admin-confidential-field"><strong>Unique Marks (Confidential):</strong> ${item.uniqueMarks || "None"}</p>
          <p class="admin-confidential-field"><strong>Admin Private Note:</strong> ${item.privateNote || "None"}</p>
          <p><strong>Status:</strong> ${getStatusBadge(item.status)}</p>
          <div class="action-row">
            ${!isClosed ? `<button onclick="window.markFoundClaimed('${docItem.id}')">Mark Claimed</button>` : `<button disabled>Closed</button>`}
          </div>
        </div>
      `;
      if (isClosed && adminResolvedFoundItemsList) adminResolvedFoundItemsList.innerHTML += card;
      if (!isClosed && adminFoundItemsList) adminFoundItemsList.innerHTML += card;
    });

    // Side-by-Side Claims Verification Comparison
    claimsSnap.forEach((docItem) => {
      const claim = docItem.data();
      const isPending = normalizeText(claim.claimStatus) === "pending";
      const lost = lostMap.get(claim.lostItemId) || {};
      const found = foundMap.get(claim.foundItemId) || {};

      const card = `
        <div class="admin-box claim-comparison-card ${!isPending ? "admin-box-muted" : ""}">
          <div class="claim-comparison-header">
            <div>
              <h3 style="margin-bottom: 2px;">Claim Verification: ${claim.itemName || "Item"}</h3>
              <span class="helper-note">Submitted: ${new Date(claim.createdAt).toLocaleDateString()}</span>
            </div>
            <div>
              <span class="theme-chip">Algorithmic Match Score: ${claim.matchScore || "N/A"}%</span>
              ${getStatusBadge(claim.claimStatus)}
            </div>
          </div>

          <div class="claim-comparison-grid">
            <div class="claim-comparison-col">
              <span class="claim-col-badge">1. Claimant Submitted Proof</span>
              <p><strong>Reason for Claim:</strong> ${claim.reason}</p>
              <p><strong>Detailed Description:</strong> ${claim.description}</p>
              <p><strong>Identifying Marks:</strong> ${claim.uniqueMarks || "None specified"}</p>
              <p><strong>Contents / Accessories:</strong> ${claim.contents || "None"}</p>
              <p><strong>Stated Lost Date:</strong> ${claim.lostDate || "N/A"}</p>
              <p><strong>Stated Lost Location:</strong> ${claim.lostPlace || "N/A"}</p>
            </div>

            <div class="claim-comparison-col">
              <span class="claim-col-badge">2. Original Lost Report</span>
              <p><strong>Item Title:</strong> ${lost.itemName || "N/A"}</p>
              <p><strong>Category:</strong> ${lost.category || "N/A"}</p>
              <p><strong>Description:</strong> ${lost.description || "N/A"}</p>
              <p><strong>Marks:</strong> ${lost.uniqueMarks || "None"}</p>
              <p><strong>Reported Date:</strong> ${lost.dateLost || "N/A"}</p>
              <p><strong>Reported Location:</strong> ${lost.locationLost || "N/A"}</p>
              ${lost.imageUrl ? `<img src="${lost.imageUrl}" alt="Lost Preview" class="item-thumb" />` : ""}
            </div>

            <div class="claim-comparison-col claim-col-confidential">
              <span class="claim-col-badge badge-confidential">3. Found Report (Confidential Log)</span>
              <p><strong>Item Title:</strong> ${found.itemName || "N/A"}</p>
              <p><strong>Category:</strong> ${found.category || "N/A"}</p>
              <p><strong>Public Description:</strong> ${found.description || "N/A"}</p>
              <p class="admin-confidential-field"><strong>Handed In At:</strong> ${found.handInLocation || "N/A"}</p>
              <p class="admin-confidential-field"><strong>Unique Marks (Secret):</strong> ${found.uniqueMarks || "None"}</p>
              <p class="admin-confidential-field"><strong>Admin Private Note:</strong> ${found.privateNote || "None"}</p>
              <p><strong>Found Date:</strong> ${found.dateFound || "N/A"}</p>
              ${found.imageUrl ? `<img src="${found.imageUrl}" alt="Found Preview" class="item-thumb" />` : ""}
            </div>
          </div>

          <div class="action-row" style="margin-top: 16px; border-top: 1px solid var(--line); padding-top: 12px;">
            ${
              isPending
                ? `<button class="btn-approve" onclick="window.approveClaim('${docItem.id}')">Approve Claim & Mark Records Resolved</button>
                   <button class="btn-reject" onclick="window.rejectClaim('${docItem.id}')">Reject Claim</button>`
                : `<button disabled>Claim Reviewed (${claim.claimStatus})</button>`
            }
          </div>
        </div>
      `;

      if (isPending && adminClaimsList) adminClaimsList.innerHTML += card;
      if (!isPending && adminReviewedClaimsList) adminReviewedClaimsList.innerHTML += card;
    });

    // Admin Match Suggestions
    if (adminMatchesList) {
      matchesSnap.forEach((docItem) => {
        const item = docItem.data();
        adminMatchesList.innerHTML += `
          <div class="admin-box">
            <h3>${item.lostItemName} ↔ ${item.foundItemName}</h3>
            <p><strong>Category:</strong> ${item.category || "—"}</p>
            <p><strong>Match Score:</strong> ${item.score || 0}%</p>
            <p><strong>Reasons:</strong> ${(item.reasons || []).join(", ") || "—"}</p>
          </div>
        `;
      });
    }

    if (adminLostItemsList && adminLostItemsList.innerHTML === "") adminLostItemsList.innerHTML = "<p>No active lost reports.</p>";
    if (adminFoundItemsList && adminFoundItemsList.innerHTML === "") adminFoundItemsList.innerHTML = "<p>No active found reports.</p>";
    if (adminClaimsList && adminClaimsList.innerHTML === "") adminClaimsList.innerHTML = "<p>No pending claims.</p>";
    if (adminMatchesList && adminMatchesList.innerHTML === "") adminMatchesList.innerHTML = "<p>No automated matches generated.</p>";
    setupImageModal();
  } catch (err) {
    console.log(err);
  }
}

function handleAdminFilters() {
  if (adminLostFilter) {
    adminLostFilter.addEventListener("change", () => {
      const mode = adminLostFilter.value;
      if (adminLostActiveSection) adminLostActiveSection.style.display = mode === "resolved" ? "none" : "block";
      if (adminLostResolvedSection) adminLostResolvedSection.style.display = mode === "active" ? "none" : "block";
    });
  }

  if (adminFoundFilter) {
    adminFoundFilter.addEventListener("change", () => {
      const mode = adminFoundFilter.value;
      if (adminFoundActiveSection) adminFoundActiveSection.style.display = mode === "resolved" ? "none" : "block";
      if (adminFoundResolvedSection) adminFoundResolvedSection.style.display = mode === "active" ? "none" : "block";
    });
  }
}

window.markLostResolved = async (id) => {
  await updateDoc(doc(db, "lostItems", id), { status: "resolved" });
  await loadAdminData();
  await loadAdminOverview();
};

window.markFoundClaimed = async (id) => {
  await updateDoc(doc(db, "foundItems", id), { status: "claimed" });
  await loadAdminData();
  await loadAdminOverview();
};

/* CLAIM APPROVAL WORKFLOW */
window.approveClaim = async (claimId) => {
  try {
    const claimRef = doc(db, "claims", claimId);
    const claimSnap = await getDoc(claimRef);
    if (!claimSnap.exists()) return;

    const claim = claimSnap.data();

    // 1. Mark Claim Approved
    await updateDoc(claimRef, {
      claimStatus: "approved",
      reviewedAt: new Date().toISOString()
    });

    // 2. Mark Lost Report Resolved in DB
    if (claim.lostItemId) {
      await updateDoc(doc(db, "lostItems", claim.lostItemId), {
        status: "resolved",
        resolvedAt: new Date().toISOString()
      });
    }

    // 3. Mark Found Report Claimed in DB
    if (claim.foundItemId) {
      await updateDoc(doc(db, "foundItems", claim.foundItemId), {
        status: "claimed",
        claimedAt: new Date().toISOString()
      });
    }

    // 4. Notify Claimant
    await createNotification(
      claim.userId,
      "Claim Approved!",
      `Your claim for "${claim.itemName}" has been approved. Visit the security/admin desk to collect your item.`,
      "success",
      { notificationKind: "claim_decision" }
    );

    showPopup("Claim approved. Records updated to Resolved/Claimed in database.", "success");
    await loadAdminData();
    await loadAdminOverview();
  } catch (err) {
    showPopup(err.message || "Failed to approve claim.", "error");
  }
};

/* CLAIM REJECTION WORKFLOW */
window.rejectClaim = async (claimId) => {
  try {
    const claimRef = doc(db, "claims", claimId);
    const claimSnap = await getDoc(claimRef);
    if (!claimSnap.exists()) return;

    const claim = claimSnap.data();

    // 1. Mark Claim Rejected (Lost & Found reports remain Active)
    await updateDoc(claimRef, {
      claimStatus: "rejected",
      reviewedAt: new Date().toISOString()
    });

    // 2. Notify Claimant
    await createNotification(
      claim.userId,
      "Claim Rejected",
      `Your claim for "${claim.itemName}" could not be verified by the admin team.`,
      "error",
      { notificationKind: "claim_decision" }
    );

    showPopup("Claim rejected. Corresponding reports remain active.", "info");
    await loadAdminData();
    await loadAdminOverview();
  } catch (err) {
    showPopup(err.message || "Failed to reject claim.", "error");
  }
};

/* MODAL & PROFILE DROPDOWN */
function setupImageModal() {
  let modal = document.getElementById("imageModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "imageModal";
    modal.className = "image-modal";
    modal.innerHTML = `<button class="image-modal-close" id="imageModalClose">Close</button><img id="imageModalImg" alt="Preview" />`;
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.id === "imageModalClose") modal.style.display = "none";
    });
  }
  const modalImg = document.getElementById("imageModalImg");
  document.querySelectorAll(".item-thumb").forEach((img) => {
    img.onclick = () => {
      modalImg.src = img.src;
      modal.style.display = "flex";
    };
  });
}

function setupProfileMenu() {
  if (!profileMenuBtn || !profileDropdown) return;
  profileMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle("show");
  });
  document.addEventListener("click", (e) => {
    if (!profileDropdown.contains(e.target) && e.target !== profileMenuBtn) {
      profileDropdown.classList.remove("show");
    }
  });
}

/* INITIALIZATION */
applyTheme(getStoredThemeMode());
showImagePreview(passportInput, passportPreview);
showImagePreview(lostImageInput, lostImagePreview);
showImagePreview(foundImageInput, foundImagePreview);
showImagePreview(settingsPassportInput, settingsPassportPreview);
setupProfileMenu();
setupThemeControls();
handleAdminFilters();

/* HOME FEATURE CARDS CLICK HANDLERS */
const featureReportLost = document.getElementById("featureReportLost");
const featureReportFound = document.getElementById("featureReportFound");

if (featureReportLost) {
  featureReportLost.addEventListener("click", () => {
    if (auth.currentUser) {
      window.location.href = "./report-lost.html";
    } else {
      Swal.fire({
        title: "Account Required",
        text: "You need to create an account before reporting a lost item.",
        icon: "info",
        confirmButtonText: "Continue",
        confirmButtonColor: "#1e3a8a"
      }).then(() => { window.location.href = "./register.html"; });
    }
  });
}

if (featureReportFound) {
  featureReportFound.addEventListener("click", () => {
    if (auth.currentUser) {
      window.location.href = "./report-found.html";
    } else {
      Swal.fire({
        title: "Account Required",
        text: "You need to create an account before reporting a found item.",
        icon: "info",
        confirmButtonText: "Continue",
        confirmButtonColor: "#1e3a8a"
      }).then(() => { window.location.href = "./register.html"; });
    }
  });
}

/* AUTH OBSERVER & ROUTE GUARD */
onAuthStateChanged(auth, async (user) => {
  const path = window.location.pathname.toLowerCase();
  const navDashboard = document.getElementById("navDashboard");
  const authLinks = document.querySelectorAll('#navLogin, #navRegister');

  const isAdminPage = path.includes("admin");
  const isProtectedUserPage = ["dashboard", "report-lost", "report-found", "claim-item", "settings", "my-reports", "profile"].some((p) => path.includes(p));

  if (user) {
    if (navDashboard) navDashboard.style.display = "inline-flex";
    authLinks.forEach((l) => l.style.display = "none");

    const userSnap = await getDoc(doc(db, "users", user.uid));
    const role = userSnap.exists() ? (userSnap.data().role || "student").toLowerCase() : "student";
    const fullName = userSnap.exists() ? userSnap.data().fullName : "User";

    if (welcomeUser) welcomeUser.textContent = role === "admin" ? `Welcome, ${fullName} (Admin).` : `Welcome, ${fullName}.`;

    if (role !== "admin" && isAdminPage) {
      window.location.href = "./dashboard.html";
      return;
    }

    if (role === "admin" && path.endsWith("dashboard.html")) {
      window.location.href = "./admin.html";
      return;
    }

    if (path.includes("settings")) loadSettings(user);
    if (path.includes("profile")) loadProfile(user);
    if (path.includes("my-reports")) loadMyReports(user.uid);
    if (claimLostItemSelect) loadUserLostReports(user.uid);
    if (notificationsList) loadNotifications(user.uid);
  } else {
    if (navDashboard) navDashboard.style.display = "none";
    authLinks.forEach((l) => l.style.display = "");
    if (isAdminPage || isProtectedUserPage) window.location.href = "./login.html";
  }

  if (adminLostCount || adminFoundCount || adminClaimsCount || adminMatchesCount) loadAdminOverview();
  if (adminLostItemsList || adminFoundItemsList || adminClaimsList || adminMatchesList) loadAdminData();
});