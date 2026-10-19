const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector("#main-nav");
function closeMenu(restoreFocus = false) {
  nav.classList.remove("is-open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.querySelector("span").textContent = "Menu";
  if (restoreFocus) menuButton.focus();
}
menuButton?.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.querySelector("span").textContent = open ? "Close" : "Menu";
  nav.classList.toggle("is-open", open);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && nav.classList.contains("is-open"))
    closeMenu(true);
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".site-header")) closeMenu();
});
matchMedia("(min-width: 951px)").addEventListener("change", () => closeMenu());

const searchInput = document.querySelector("#faq-search");
if (searchInput) {
  const filters = [...document.querySelectorAll("[data-filter]")];
  const items = [...document.querySelectorAll("#faq-list .faq-item")];
  const clear = document.querySelector("#clear-search");
  let category = "all";
  const update = () => {
    const search = searchInput.value.trim().toLocaleLowerCase();
    let count = 0;
    items.forEach((item) => {
      const visible =
        (category === "all" || item.dataset.category === category) &&
        item.textContent.toLocaleLowerCase().includes(search);
      item.hidden = !visible;
      if (visible) count++;
      else item.open = false;
    });
    document.querySelector(".search-count").textContent =
      `${count} ${count === 1 ? "question" : "questions"}${search ? " matching your search" : ""}`;
    document.querySelector("#faq-empty").hidden = count !== 0;
    clear.hidden = searchInput.value.length === 0;
  };
  filters.forEach((button) =>
    button.addEventListener("click", () => {
      category = button.dataset.filter;
      filters.forEach((other) =>
        other.setAttribute("aria-pressed", String(button === other)),
      );
      update();
    }),
  );
  searchInput.addEventListener("input", update);
  document
    .querySelector(".faq-search")
    .addEventListener("submit", (event) => event.preventDefault());
  clear.addEventListener("click", () => {
    searchInput.value = "";
    update();
    searchInput.focus();
  });
  document.querySelector("#reset-search").addEventListener("click", () => {
    category = "all";
    searchInput.value = "";
    filters.forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.filter === "all"),
      ),
    );
    update();
    searchInput.focus();
  });
}

const form = document.querySelector("#enquiry-form");
if (form) {
  const serviceSelect = form.elements.service;
  const requestedService = new URLSearchParams(location.search).get("service");
  if (
    [...serviceSelect.options].some(
      (option) => option.value === requestedService,
    )
  )
    serviceSelect.value = requestedService;
  const details = form.elements.details;
  const count = document.querySelector("#character-count");
  details.addEventListener("input", () => {
    count.textContent = `${details.value.length} / 1500`;
  });
  const errorBox = document.querySelector("#form-errors");
  const result = document.querySelector("#enquiry-result");
  let enquiryText = "";
  let attempted = false;
  const validators = {
    name: (value) =>
      value.trim().length >= 2
        ? ""
        : "Enter a name with at least 2 characters.",
    phone: (value) =>
      /^(?:\+?65)?[89]\d{7}$/.test(value.replace(/[\s()-]/g, ""))
        ? ""
        : "Enter an 8-digit Singapore mobile number starting with 8 or 9.",
    postal: (value) =>
      /^\d{6}$/.test(value.trim())
        ? ""
        : "Enter a 6-digit Singapore postal code.",
    property: (value) => (value ? "" : "Choose your property type."),
    service: (value) =>
      value ? "" : "Choose a service, or select “Something else / not sure”.",
    details: (value) =>
      value.trim().length >= 10
        ? ""
        : "Describe the issue in at least 10 characters.",
    email: (value) =>
      !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? ""
        : "Enter a valid email address or leave this optional field blank.",
  };
  const validateField = (name) => {
    const input = form.elements[name];
    const message = validators[name](input.value);
    document.querySelector(`#${name}-error`).textContent = message;
    if (message) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
    return message;
  };
  Object.keys(validators).forEach((name) => {
    const input = form.elements[name];
    input.addEventListener("input", () => {
      if (attempted) validateField(name);
    });
    input.addEventListener("change", () => {
      if (attempted) validateField(name);
    });
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    attempted = true;
    const errors = Object.keys(validators)
      .map((name) => [name, validateField(name)])
      .filter(([, message]) => message);
    errorBox.replaceChildren();
    if (errors.length) {
      errorBox.hidden = false;
      const title = document.createElement("strong");
      title.textContent = `Please check ${errors.length} ${errors.length === 1 ? "field" : "fields"} before previewing.`;
      const list = document.createElement("ul");
      errors.forEach(([name, message]) => {
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.href = `#${name}`;
        link.textContent = message;
        link.addEventListener("click", (e) => {
          e.preventDefault();
          form.elements[name].focus();
        });
        li.append(link);
        list.append(li);
      });
      errorBox.append(title, list);
      errorBox.focus();
      return;
    }
    errorBox.hidden = true;
    const rows = [
      ["Name", form.elements.name.value.trim()],
      ["Mobile", form.elements.phone.value.trim()],
      ["Postal code", form.elements.postal.value.trim()],
      ["Property", form.elements.property.value],
      ["Service", serviceSelect.selectedOptions[0].textContent],
      ["Issue", details.value.trim()],
    ];
    if (form.elements.email.value.trim())
      rows.push(["Email", form.elements.email.value.trim()]);
    const summary = document.querySelector("#enquiry-summary");
    summary.replaceChildren();
    rows.forEach(([label, value]) => {
      const row = document.createElement("div");
      const dt = document.createElement("dt");
      dt.textContent = label;
      const dd = document.createElement("dd");
      dd.textContent = value;
      row.append(dt, dd);
      summary.append(row);
    });
    enquiryText = `Plumbing enquiry — demonstration only, not sent\n\n${rows.map(([label, value]) => `${label}: ${value}`).join("\n")}`;
    document.querySelector("#copy-status").textContent = "";
    document.querySelector("#copy-fallback").hidden = true;
    form.hidden = true;
    result.hidden = false;
    document.querySelector("#result-title").focus();
  });
  document.querySelector("#edit-enquiry").addEventListener("click", () => {
    result.hidden = true;
    form.hidden = false;
    form.elements.name.focus();
  });
  document
    .querySelector("#copy-enquiry")
    .addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(enquiryText);
        document.querySelector("#copy-status").textContent =
          "Copied. No enquiry has been sent.";
      } catch {
        document.querySelector("#copy-fallback").hidden = false;
        const textarea = document.querySelector("#copy-text");
        textarea.value = enquiryText;
        textarea.focus();
        textarea.select();
        document.querySelector("#copy-status").textContent =
          "Select and copy the enquiry text below.";
      }
    });
  document.querySelector("#preview-enquiry").disabled = false;
  form.classList.add("form-ready");
}
