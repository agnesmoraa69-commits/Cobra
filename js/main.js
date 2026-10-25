// ---- Supabase setup ----
const SUPABASE_URL = "https://heegblkuginpffhuvauu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1inZ79YoBSGjge3CSW4WaA_9PTMa2ct";

const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
// ---- end Supabase setup ----

// COBRA FX - Main JS

document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu
  const toggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  // Language dropdown
  const langBtn = document.querySelector('.lang-btn');
  const langDropdown = document.querySelector('.lang-dropdown');
  if (langBtn && langDropdown) {
    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      langDropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => {
      langDropdown.classList.remove('open');
    });
  }

  // FAQ accordion
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  // Active nav link
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
});

// ---- Sign-up popup: saves user to Supabase, then goes to Deriv ----
(function () {
  if (!supabaseClient) return;

  let destination = "https://partner-tracking.deriv.com/click?a=7270&o=1&c=3&link_id=1";
  let loggedIn = false;

  supabaseClient.auth.getSession().then(function (res) {
    loggedIn = !!res.data.session;
  });
  supabaseClient.auth.onAuthStateChange(function (_event, session) {
    loggedIn = !!session;
  });

  const style = document.createElement("style");
  style.textContent = `
    .su-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);display:none;align-items:center;justify-content:center;z-index:9999;padding:16px}
    .su-overlay.show{display:flex}
    .su-box{background:#141a24;color:#fff;border:1px solid #2a3344;border-radius:14px;padding:24px;width:100%;max-width:400px;max-height:90vh;overflow:auto;position:relative}
    .su-box h3{margin:0 0 6px;font-size:1.3rem}
    .su-box p{margin:0 0 16px;font-size:.9rem;opacity:.8}
    .su-box input{width:100%;padding:12px;margin-bottom:10px;border-radius:8px;border:1px solid #2a3344;background:#0d1117;color:#fff;font-size:1rem;box-sizing:border-box}
    .su-submit{width:100%;padding:13px;border:0;border-radius:8px;background:#22c55e;color:#04210f;font-weight:700;font-size:1rem;cursor:pointer}
    .su-submit:disabled{opacity:.6}
    .su-close{position:absolute;top:8px;right:14px;background:none;border:0;color:#fff;font-size:1.8rem;cursor:pointer}
    .su-msg{margin-top:10px;font-size:.9rem}
    .su-skip{display:block;text-align:center;margin-top:12px;font-size:.85rem;color:#9aa4b2}
  `;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.className = "su-overlay";
  overlay.innerHTML = `
    <div class="su-box">
      <button class="su-close" type="button" aria-label="Close">&times;</button>
      <h3>Create your COBRA FX account</h3>
      <p>Sign up to get your demo balance, then continue to Deriv.</p>
      <form id="su-form">
        <input id="su-name" type="text" placeholder="Full name" autocomplete="name">
        <input id="su-email" type="email" placeholder="Email" autocomplete="email">
        <input id="su-phone" type="tel" placeholder="Phone (optional)" autocomplete="tel">
        <input id="su-pass" type="password" placeholder="Password (min 6 characters)" autocomplete="new-password">
        <button class="su-submit" type="submit">Sign up &amp; continue</button>
      </form>
      <div class="su-msg" id="su-msg"></div>
      <a class="su-skip" id="su-skip" href="#">Skip, go straight to Deriv</a>
    </div>`;
  document.body.appendChild(overlay);

  const form = overlay.querySelector("#su-form");
  const msg = overlay.querySelector("#su-msg");
  const btn = overlay.querySelector(".su-submit");

  function closePopup() {
    overlay.classList.remove("show");
  }

  // Catch every Open Account / CTA link that goes to Deriv
  document.addEventListener("click", function (e) {
    const link = e.target.closest('a[href*="partner-tracking.deriv.com"]');
    if (!link || loggedIn) return;
    e.preventDefault();
    destination = link.href;
    msg.textContent = "";
    overlay.classList.add("show");
  });

  overlay.querySelector(".su-close").addEventListener("click", closePopup);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closePopup();
  });
  overlay.querySelector("#su-skip").addEventListener("click", function (e) {
    e.preventDefault();
    window.location.href = destination;
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const full_name = form.querySelector("#su-name").value.trim();
    const email = form.querySelector("#su-email").value.trim();
    const phone = form.querySelector("#su-phone").value.trim();
    const password = form.querySelector("#su-pass").value;

    if (!full_name || !email || password.length < 6) {
      msg.textContent = "Please enter your name, email and a password of at least 6 characters.";
      return;
    }

    btn.disabled = true;
    msg.textContent = "Creating your account...";

    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: { data: { full_name: full_name, phone: phone } }
    });

    if (error) {
      msg.textContent = error.message;
      btn.disabled = false;
      return;
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      msg.textContent = "This email is already registered.";
      btn.disabled = false;
      return;
    }

    msg.textContent = data.session
      ? "Account created! Taking you to Deriv..."
      : "Account created! Check your email to confirm it. Taking you to Deriv...";
    setTimeout(function () {
      window.location.href = destination;
    }, 1800);
  });
})();
