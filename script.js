const $ = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => [...p.querySelectorAll(s)];
const burger = $('.burger');
const links = $('.nav__links');
if (burger && links) burger.addEventListener('click', () => links.classList.toggle('open'));
const io = new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('show') }), {threshold:.12});
$$('.fade-up').forEach(el => io.observe(el));
$$('[data-plan]').forEach(btn => btn.addEventListener('click', () => {
  const plan = btn.dataset.plan;
  localStorage.setItem('foturPlan', plan);
  const select = $('#plan');
  if(select) select.value = plan;
  location.href = 'tariffs.html#order';
}));
const form = $('#orderForm');
if(form){
  const status = $('#formStatus');
  const saved = localStorage.getItem('foturPlan');
  if(saved && $('#plan')) $('#plan').value = saved;
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    status.textContent = 'Отправляем запрос на сервер FOTUR...';
    try{
      // Вставь сюда свой реальный endpoint API.
      const API_URL = 'https://api.example.com/subscriptions/create';
      // Для реального запуска раскомментируй fetch ниже и замени API_URL.
      // const response = await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      // const data = await response.json();
      await new Promise(r=>setTimeout(r,700));
      status.textContent = `Заявка принята. Тариф: ${payload.plan}. Подключи реальный API в script.js.`;
      form.reset();
    }catch(err){
      status.textContent = 'Ошибка соединения с API. Проверь CORS и адрес сервера.';
    }
  });
}
const timer = $('#sessionTimer');
if(timer){let sec=15153; setInterval(()=>{sec++; const h=String(Math.floor(sec/3600)).padStart(2,'0'),m=String(Math.floor(sec%3600/60)).padStart(2,'0'),s=String(sec%60).padStart(2,'0'); timer.textContent=`${h}:${m}:${s}`},1000)}
