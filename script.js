const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

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

async function handleLeadForm(form) {
  const status = form.querySelector("[data-status]");
  const payload = Object.fromEntries(new FormData(form).entries());

  if (status) {
    status.textContent = "Шифруем запрос и готовим отправку...";
  }

  try {
    // Подключи сюда свой endpoint, когда будет готов backend.
    const API_URL = "https://api.example.com/fotur/intake";
    void API_URL;
    // Пример реальной отправки:
    // await fetch(API_URL, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(payload),
    // });
    await new Promise((resolve) => setTimeout(resolve, 700));

    const route = payload.plan || payload.issue || "custom";
    if (status) {
      status.textContent = `Запрос принят. Маршрут: ${route}. Подключи реальный API в script.js, чтобы форма стала боевой.`;
    }

    form.reset();
    if ($("#plan") && savedPlan) {
      $("#plan").value = savedPlan;
    }
  } catch (error) {
    if (status) {
      status.textContent = "Не удалось отправить запрос. Проверь endpoint, CORS и настройки backend.";
    }
  }
}

$$("[data-lead-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    handleLeadForm(form);
  });
});
