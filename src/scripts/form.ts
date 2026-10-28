type Method = 'whatsapp' | 'email';

const MESSAGES = {
  name: 'Escribe tu nombre.',
  whatsapp: 'Escribe un número de WhatsApp válido, con código de país.',
  email: 'Escribe un email válido, por ejemplo nombre@correo.com.',
  program: 'Elige un programa o «Aún no lo sé».',
  guardian: 'Para menores, la solicitud debe hacerla su madre, padre o tutor.',
  consent: 'Necesitamos tu consentimiento para responderte.',
};

/** Registration without a backend: opens WhatsApp or email with the message written, or says plainly
 *  that the form is not connected yet. It never shows a success that did not happen. */
export function initForm(form: HTMLFormElement) {
  const $ = <T extends HTMLElement>(id: string) => form.querySelector<T>(`#${id}`)!;
  const name = $<HTMLInputElement>('f-name');
  const contact = $<HTMLInputElement>('f-contact');
  const program = $<HTMLSelectElement>('f-program');
  const msg = $<HTMLTextAreaElement>('f-msg');
  const guardian = $<HTMLInputElement>('f-guardian');
  const consent = $<HTMLInputElement>('f-consent');
  const guardianWrap = form.querySelector<HTMLElement>('[data-guardian]')!;
  const contactLabel = form.querySelector<HTMLElement>('[data-contact-label]')!;
  const result = form.querySelector<HTMLElement>('[data-result]')!;
  const radios = [...form.querySelectorAll<HTMLButtonElement>('[data-method]')];
  let method: Method = 'whatsapp';

  const fields: Record<string, HTMLInputElement | HTMLSelectElement> = { name, contact, program, guardian, consent };

  function setError(key: string, text: string | null) {
    const el = fields[key];
    const err = form.querySelector<HTMLElement>(`#e-${key}`)!;
    err.hidden = !text;
    err.textContent = text ?? '';
    if (text) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
  }

  function setMethod(m: Method, focus = false) {
    method = m;
    radios.forEach((r) => { const on = r.dataset.method === m; r.setAttribute('aria-checked', String(on)); r.tabIndex = on ? 0 : -1; if (on && focus) r.focus(); });
    const wa = m === 'whatsapp';
    contactLabel.textContent = wa ? 'Tu número de WhatsApp' : 'Tu email';
    contact.type = wa ? 'tel' : 'email';
    contact.inputMode = wa ? 'tel' : 'email';
    contact.autocomplete = wa ? 'tel' : 'email';
    contact.placeholder = wa ? '+57 300 000 0000' : 'nombre@correo.com';
    contact.value = '';
    setError('contact', null);
    result.innerHTML = '';
  }

  const isMinor = () => program.value === 'Infantil' || program.value === 'Juvenil';
  const syncGuardian = () => { guardianWrap.hidden = !isMinor(); if (!isMinor()) setError('guardian', null); };

  radios.forEach((r) => r.addEventListener('click', () => setMethod(r.dataset.method as Method)));
  form.querySelector('[role="radiogroup"]')!.addEventListener('keydown', (e) => {
    const k = (e as KeyboardEvent).key;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(k)) return;
    e.preventDefault();
    setMethod(method === 'whatsapp' ? 'email' : 'whatsapp', true);
  });
  [name, contact, program, guardian, consent].forEach((el) => el.addEventListener(el instanceof HTMLInputElement && el.type === 'checkbox' ? 'change' : 'input', () => {
    const key = Object.keys(fields).find((k) => fields[k] === el)!;
    setError(key, null);
    result.innerHTML = '';
  }));
  program.addEventListener('change', syncGuardian);

  function validate() {
    const e: Record<string, string> = {};
    if (name.value.trim().length < 2) e.name = MESSAGES.name;
    const c = contact.value.trim();
    if (method === 'whatsapp') { if (c.replace(/\D/g, '').length < 7) e.contact = MESSAGES.whatsapp; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c)) e.contact = MESSAGES.email;
    if (!program.value) e.program = MESSAGES.program;
    if (isMinor() && !guardian.checked) e.guardian = MESSAGES.guardian;
    if (!consent.checked) e.consent = MESSAGES.consent;
    return e;
  }

  function show(kind: 'ok' | 'warn', title: string, body: string, href?: string, linkLabel?: string, preview?: string) {
    const box = document.createElement('div');
    box.className = `reg__result is-${kind}`;
    const t = document.createElement('strong'); t.textContent = title; box.append(t);
    const p = document.createElement('p'); p.textContent = body; box.append(p);
    if (href) { const a = document.createElement('a'); a.href = href; a.target = '_blank'; a.rel = 'noopener'; a.textContent = linkLabel!; box.append(a); }
    if (preview) { const pre = document.createElement('pre'); pre.textContent = preview; box.append(pre); }
    result.replaceChildren(box);
  }

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const errors = validate();
    Object.keys(fields).forEach((k) => setError(k, errors[k] ?? null));
    const first = Object.keys(fields).find((k) => errors[k]);
    if (first) { result.innerHTML = ''; fields[first].focus(); return; }

    const text = [
      'Hola, quiero información para entrenar en el Club Deportivo de Judo Hikawa.',
      `Nombre: ${name.value.trim()}`,
      `Programa: ${program.value}`,
      `Contacto preferido: ${method === 'whatsapp' ? 'WhatsApp' : 'Email'}: ${contact.value.trim()}`,
      isMinor() && guardian.checked ? 'Solicitud hecha por madre, padre o tutor.' : '',
      msg.value.trim() ? `Mensaje: ${msg.value.trim()}` : '',
    ].filter(Boolean).join('\n');
    const wa = (form.dataset.wa ?? '').replace(/\D/g, '');
    const mail = (form.dataset.email ?? '').trim();

    if (wa.length >= 7) {
      const href = `https://wa.me/${wa}?text=${encodeURIComponent(text)}`;
      window.open(href, '_blank', 'noopener');
      show('ok', 'ABRIMOS WHATSAPP', 'Tu mensaje está listo en WhatsApp. Pulsa enviar allí para completar la solicitud. Si no se abrió, usa el enlace. Después, el club te responde y coordinan tu primera clase.', href, 'Abrir WhatsApp');
    } else if (mail) {
      const href = `mailto:${mail}?subject=${encodeURIComponent('Inscripción: ' + program.value)}&body=${encodeURIComponent(text)}`;
      window.location.href = href;
      show('ok', 'ABRIMOS TU EMAIL', 'Tu mensaje está listo en tu aplicación de correo. Envíalo para completar la solicitud. Después, el club te responde y coordinan tu primera clase.', href, 'Abrir email');
    } else {
      show('warn', 'FORMULARIO AÚN NO CONECTADO', 'Falta configurar el WhatsApp o el email del club. Tu solicitud no se ha enviado. Este es el mensaje que se enviaría:', undefined, undefined, text);
    }
  });

  // Program buttons elsewhere on the page pre-select the program, then bring the visitor to the form.
  document.querySelectorAll<HTMLButtonElement>('[data-pick]').forEach((b) => b.addEventListener('click', () => {
    program.value = b.dataset.pick!;
    setError('program', null);
    syncGuardian();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const top = form.closest('section')!.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
    let done = false;
    const focus = () => { if (done) return; done = true; name.focus({ preventScroll: true }); };
    if (reduced) focus();
    else { window.addEventListener('scrollend', focus, { once: true }); setTimeout(focus, 900); }
  }));
}
