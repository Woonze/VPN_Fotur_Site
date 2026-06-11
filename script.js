const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const ALLOWED_EMAIL_DOMAINS = new Set(["google.com", "mail.ru", "yandex.ru"]);
const FREE_ACCESS_STORAGE_KEY = "fotur-free-access-issued";

const burger = $(".burger");
const links = $(".nav__links");

if (burger && links) {
  burger.addEventListener("click", () => links.classList.toggle("open"));
  links.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      links.classList.remove("open");
    }
  });
}

const page = document.body.dataset.page;
if (page) {
  $(`[data-page="${page}"]`)?.classList.add("active");
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  },
  { threshold: 0.14 }
);

$$(".fade-up").forEach((element) => observer.observe(element));

$$("[data-plan]").forEach((button) => {
  button.addEventListener("click", () => {
    const plan = button.dataset.plan;
    localStorage.setItem("foturPlan", plan);
    const orderSelect = $("#plan");
    if (orderSelect) {
      orderSelect.value = plan;
      document.querySelector("#order")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    location.href = "tariffs.html#order";
  });
});

const savedPlan = localStorage.getItem("foturPlan");
if (savedPlan && $("#plan")) {
  $("#plan").value = savedPlan;
}

function validateEmailDomain(email) {
  const domain = email.trim().toLowerCase().split("@")[1];
  return ALLOWED_EMAIL_DOMAINS.has(domain);
}

async function sha256(input) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function readWebGlFingerprint() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      return "no-webgl";
    }
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (!ext) {
      return "webgl-restricted";
    }
    const vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);
    const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
    return `${vendor}::${renderer}`;
  } catch (error) {
    return "webgl-error";
  }
}

function readCanvasFingerprint() {
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.textBaseline = "top";
    context.font = "16px Unbounded";
    context.fillStyle = "#68f3ff";
    context.fillRect(8, 8, 160, 24);
    context.fillStyle = "#050505";
    context.fillText("FOTUR::canvas", 10, 10);
    return canvas.toDataURL();
  } catch (error) {
    return "canvas-error";
  }
}

async function fetchIpAddress() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const response = await fetch("https://api.ipify.org?format=json", { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) {
      return "ip-unavailable";
    }
    const data = await response.json();
    return data.ip || "ip-unavailable";
  } catch (error) {
    return "ip-unavailable";
  }
}

async function collectClientProfile() {
  const canvasFingerprint = readCanvasFingerprint();
  const webglFingerprint = readWebGlFingerprint();
  const ip = await fetchIpAddress();

  const profile = {
    ip,
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages?.join(",") || "",
    platform: navigator.platform,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    screen: `${window.screen.width}x${window.screen.height}`,
    colorDepth: String(window.screen.colorDepth || ""),
    deviceMemory: navigator.deviceMemory || "",
    hardwareConcurrency: navigator.hardwareConcurrency || "",
    touchPoints: navigator.maxTouchPoints || 0,
    cookieEnabled: navigator.cookieEnabled,
    canvasFingerprint,
    webglFingerprint,
  };

  profile.fingerprint = await sha256(JSON.stringify(profile));
  return profile;
}

async function handleBridgeForm(form) {
  const status = form.querySelector("[data-status]");
  const email = form.elements.email.value.trim().toLowerCase();

  if (!validateEmailDomain(email)) {
    status.textContent = "Попробуйте другую почту.";
    return;
  }

  if (localStorage.getItem(FREE_ACCESS_STORAGE_KEY)) {
    status.textContent = "Для этого браузера временный доступ уже выдавался.";
    return;
  }

  status.textContent = "Проверяем почту и подготавливаем выдачу...";

  const profile = await collectClientProfile();
  const issueKey = await sha256(`${email}:${profile.fingerprint}`);

  if (localStorage.getItem(issueKey)) {
    status.textContent = "Для этой почты и устройства доступ уже выдавался.";
    return;
  }

  const payload = {
    email,
    source: "temporary-access",
    issuedInstantly: true,
    profile,
  };

  try {
    // Для реального запуска лучше принимать IP на backend и там же жестко
    // блокировать повторные выдачи по fingerprint/email/IP.
    const API_URL = "https://api.example.com/fotur/free-access";
    void API_URL;
    // await fetch(API_URL, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(payload),
    // });
    console.debug(payload);
    await new Promise((resolve) => setTimeout(resolve, 650));

    localStorage.setItem(FREE_ACCESS_STORAGE_KEY, "1");
    localStorage.setItem(issueKey, JSON.stringify({ email, fingerprint: profile.fingerprint }));
    status.textContent = "Запрос принят. Автоматическая выдача ссылки будет подключена следующим этапом.";
    form.reset();
  } catch (error) {
    status.textContent = "Не удалось обработать запрос. Попробуйте еще раз.";
  }
}

async function handleOrderForm(form) {
  const status = form.querySelector("[data-status]");
  const payload = Object.fromEntries(new FormData(form).entries());

  status.textContent = "Отправляем заявку...";

  try {
    const API_URL = "https://api.example.com/fotur/orders";
    void API_URL;
    // await fetch(API_URL, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(payload),
    // });
    await new Promise((resolve) => setTimeout(resolve, 650));
    status.textContent = `Заявка принята. Период: ${payload.plan}.`;
    form.reset();
    if ($("#plan") && savedPlan) {
      $("#plan").value = savedPlan;
    }
  } catch (error) {
    status.textContent = "Не удалось отправить заявку. Попробуйте еще раз.";
  }
}

$$("[data-lead-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const type = form.dataset.leadForm;
    if (type === "bridge") {
      await handleBridgeForm(form);
      return;
    }
    await handleOrderForm(form);
  });
});
